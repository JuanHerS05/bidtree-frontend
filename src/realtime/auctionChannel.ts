/**
 * Canal WebSocket de una sala de pujas (`/ws/auction/{subasta_id}` en ms-pujas).
 * Traduce los mensajes del backend (nombres configurables en config/topics.ts → WS_EVENTS)
 * a un conjunto fijo de mensajes internos (`RoomMsg`) que consume la UI.
 */
import { env } from '@/config/env';
import { ENDPOINTS, buildPath } from '@/config/endpoints';
import { serviceWsUrl } from '@/config/services';
import { WS_EVENTS, wsEventKeyByName } from '@/config/topics';
import type { AuctionStatus, Bid } from '@/lib/types';
import { useAuthStore } from '@/store/auth.store';
import { db } from '@/api/mock/db';
import { mockBus, placeBid } from '@/api/mock/engine';
import { ReconnectingSocket } from './ReconnectingSocket';
import type { Connection } from '@/store/room.store';

export type RoomMsg =
  | { kind: 'snapshot'; currentBid: number; bidCount: number; endsAt: string; status: AuctionStatus; bids: Bid[]; viewers?: number }
  | { kind: 'bid'; bid: Bid; endsAt: string; currentBid: number; bidCount: number; extended: boolean }
  | { kind: 'extended'; endsAt: string }
  | { kind: 'ended'; winnerId: string | null; winnerName: string | null; finalPrice: number; orderId: string | null }
  | { kind: 'viewers'; viewers: number }
  | { kind: 'error'; message: string };

export interface AuctionChannel { sendBid: (amount: number) => void; close: () => void }
interface Handlers { onMessage: (m: RoomMsg) => void; onStatus: (c: Connection) => void }

/** Acepta camelCase o snake_case para tolerar el contrato real del backend. */
const pick = (o: any, ...keys: string[]) => { for (const k of keys) if (o?.[k] !== undefined) return o[k]; return undefined; };
export const normalizeBid = (r: any): Bid => ({
  id: String(pick(r, 'id', 'bid_id') ?? `${pick(r, 'userId', 'user_id')}-${pick(r, 'at', 'timestamp')}-${pick(r, 'amount')}`),
  auctionId: String(pick(r, 'auctionId', 'auction_id', 'subasta_id') ?? ''),
  userId: String(pick(r, 'userId', 'user_id') ?? ''),
  userName: String(pick(r, 'userName', 'user_name', 'username', 'nombre') ?? 'Postor'),
  amount: Number(pick(r, 'amount', 'monto')),
  at: String(pick(r, 'at', 'timestamp', 'created_at') ?? new Date().toISOString()),
});

function parse(raw: any): RoomMsg | null {
  const key = wsEventKeyByName(String(raw?.type ?? ''));
  switch (key) {
    case 'snapshot':
      return { kind: 'snapshot', currentBid: Number(pick(raw, 'currentBid', 'current_bid')), bidCount: Number(pick(raw, 'bidCount', 'bid_count') ?? 0),
        endsAt: String(pick(raw, 'endsAt', 'ends_at')), status: (raw.status ?? 'ACTIVE') as AuctionStatus,
        bids: ((raw.bids ?? []) as any[]).map(normalizeBid), viewers: raw.viewers };
    case 'newBid':
      return { kind: 'bid', bid: normalizeBid(raw.bid ?? raw), endsAt: String(pick(raw, 'endsAt', 'ends_at')),
        currentBid: Number(pick(raw, 'currentBid', 'current_bid') ?? raw.bid?.amount), bidCount: Number(pick(raw, 'bidCount', 'bid_count') ?? 0),
        extended: Boolean(raw.extended) };
    case 'timeExtended': return { kind: 'extended', endsAt: String(pick(raw, 'endsAt', 'ends_at')) };
    case 'auctionEnded':
      return { kind: 'ended', winnerId: pick(raw, 'winnerId', 'winner_id') ?? null, winnerName: pick(raw, 'winnerName', 'winner_name') ?? null,
        finalPrice: Number(pick(raw, 'finalPrice', 'final_price') ?? 0), orderId: pick(raw, 'orderId', 'order_id') ?? null };
    case 'viewers': return { kind: 'viewers', viewers: Number(raw.viewers) };
    case 'error': return { kind: 'error', message: String(raw.message ?? 'Error en la sala') };
    default: return null;
  }
}

export function openAuctionChannel(auctionId: string, h: Handlers): AuctionChannel {
  return env.USE_MOCKS ? mockChannel(auctionId, h) : realChannel(auctionId, h);
}

function realChannel(auctionId: string, h: Handlers): AuctionChannel {
  const sock = new ReconnectingSocket(
    () => {
      const base = serviceWsUrl(ENDPOINTS.ws.auction.service, buildPath(ENDPOINTS.ws.auction.path, { subasta_id: auctionId }));
      const token = useAuthStore.getState().token;
      return token ? `${base}?token=${encodeURIComponent(token)}` : base;
    },
    { onMessage: (raw) => { const m = parse(raw); if (m) h.onMessage(m); }, onStatus: h.onStatus },
  );
  sock.connect();
  return {
    sendBid: (amount) => {
      if (!sock.send({ type: WS_EVENTS.placeBid, auctionId, amount })) h.onMessage({ kind: 'error', message: 'Sin conexión con la sala. Reintentando…' });
    },
    close: () => sock.close(),
  };
}

function mockChannel(auctionId: string, h: Handlers): AuctionChannel {
  h.onStatus('connecting');
  const a = db.auctions.find((x) => x.id === auctionId);
  const t = setTimeout(() => {
    if (!a) return h.onMessage({ kind: 'error', message: 'Subasta no encontrada' });
    h.onStatus('open');
    h.onMessage({ kind: 'snapshot', currentBid: a.currentBid, bidCount: a.bidCount, endsAt: a.endsAt, status: a.status, bids: [...(db.bids[a.id] ?? [])], viewers: 800 + Math.floor(Math.random() * 900) });
  }, 350);
  const unsub = mockBus.subscribe((e) => {
    if (e.kind === 'bid' && e.auctionId === auctionId) h.onMessage({ kind: 'bid', bid: e.bid, endsAt: e.endsAt, currentBid: e.currentBid, bidCount: e.bidCount, extended: e.extended });
    if (e.kind === 'ended' && e.auctionId === auctionId) h.onMessage({ kind: 'ended', winnerId: e.winner?.id ?? null, winnerName: e.winner?.name ?? null, finalPrice: e.finalPrice, orderId: e.orderId });
  });
  const viewers = setInterval(() => h.onMessage({ kind: 'viewers', viewers: 800 + Math.floor(Math.random() * 900) }), 7000);
  return {
    sendBid: (amount) => {
      const me = db.me;
      if (!me) return h.onMessage({ kind: 'error', message: 'Debes iniciar sesión' });
      try { placeBid(auctionId, me.id, me.name, amount); } catch (e) { h.onMessage({ kind: 'error', message: (e as Error).message }); }
    },
    close: () => { clearTimeout(t); clearInterval(viewers); unsub(); },
  };
}
