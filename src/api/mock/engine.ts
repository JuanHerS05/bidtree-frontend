/**
 * "Servidor" simulado: reglas de ms-pujas (puja válida, Anti-Sniping, cierre) y emisión
 * de eventos de tópicos hacia la UI. Solo se usa con VITE_USE_MOCKS=true.
 */
import { APP } from '@/config/app.config';
import { TOPICS } from '@/config/topics';
import type { Bid, Order } from '@/lib/types';
import { db, nextId, RIVALS } from './db';

export type MockEvent =
  | { kind: 'bid'; auctionId: string; bid: Bid; endsAt: string; currentBid: number; bidCount: number; extended: boolean }
  | { kind: 'ended'; auctionId: string; winner: { id: string; name: string } | null; finalPrice: number; orderId: string | null }
  | { kind: 'topic'; topic: string; payload: Record<string, any> };

type Listener = (e: MockEvent) => void;
const listeners = new Set<Listener>();
export const mockBus = {
  subscribe(l: Listener) { listeners.add(l); return () => { listeners.delete(l); }; },
  emit(e: MockEvent) { listeners.forEach((l) => l(e)); },
};

export const publishTopic = (topic: string, payload: Record<string, any>) =>
  mockBus.emit({ kind: 'topic', topic, payload });

export function placeBid(auctionId: string, userId: string, userName: string, amount: number): Bid {
  const a = db.auctions.find((x) => x.id === auctionId);
  if (!a) throw new Error('La subasta no existe');
  if (a.status !== 'ACTIVE' || new Date(a.endsAt).getTime() <= Date.now()) throw new Error('La subasta ya finalizó');
  if (a.seller.id === userId) throw new Error('No puedes pujar en tu propia subasta');
  if (amount < a.currentBid + APP.minIncrement) throw new Error('Tu puja debe superar el monto actual');

  const prevLeaderId = db.bids[a.id][0]?.userId;
  const bid: Bid = { id: nextId('b'), auctionId, userId, userName, amount, at: new Date().toISOString() };
  db.bids[a.id].unshift(bid);
  a.currentBid = amount; a.bidCount += 1; a.winner = { id: userId, name: userName };

  // Anti-Sniping: puja en los últimos N segundos → +N segundos
  const remaining = new Date(a.endsAt).getTime() - Date.now();
  const extended = remaining <= APP.antiSnipingWindowSeconds * 1000;
  if (extended) a.endsAt = new Date(new Date(a.endsAt).getTime() + APP.antiSnipingExtensionSeconds * 1000).toISOString();

  mockBus.emit({ kind: 'bid', auctionId, bid, endsAt: a.endsAt, currentBid: a.currentBid, bidCount: a.bidCount, extended });

  if (db.me && prevLeaderId === db.me.id && userId !== db.me.id) {
    publishTopic(TOPICS.outbid, { userId: db.me.id, auctionId, title: a.title, amount, by: userName });
  }
  for (const al of db.alerts) {
    if (!al.triggered && al.auctionId === auctionId && amount >= al.threshold) {
      al.triggered = true;
      publishTopic(TOPICS.priceLimitReached, { userId: al.userId, auctionId, title: a.title, threshold: al.threshold, amount });
    }
  }
  return bid;
}

function closeAuction(auctionId: string) {
  const a = db.auctions.find((x) => x.id === auctionId);
  if (!a || a.status !== 'ACTIVE') return;
  a.status = 'ENDED';
  const top = db.bids[a.id][0];
  let order: Order | null = null;
  if (top) {
    order = {
      id: `ord-${a.id}`, auctionId: a.id, title: a.title, imageUrl: a.imageUrl, sellerName: a.seller.name,
      finalPrice: top.amount, availableCredit: db.rewards.balance, status: 'PENDING',
    };
    db.orders.push(order);
    a.orderId = order.id;
  }
  mockBus.emit({ kind: 'ended', auctionId: a.id, winner: top ? { id: top.userId, name: top.userName } : null, finalPrice: a.currentBid, orderId: order?.id ?? null });
  if (top) publishTopic(TOPICS.auctionEnded, { auctionId: a.id, title: a.title, winnerId: top.userId, winnerName: top.userName, amount: top.amount, orderId: order!.id });
}

let started = false;
export function startMockEngine() {
  if (started) return;
  started = true;
  setInterval(() => {
    const now = Date.now();
    for (const a of db.auctions) {
      if (a.status !== 'ACTIVE') continue;
      const remaining = new Date(a.endsAt).getTime() - now;
      if (remaining <= 0) { closeAuction(a.id); continue; }
      // Rivales simulados: casi siempre quietos, más activos en el tramo final (para ver el Anti-Sniping).
      const p = remaining < 25_000 ? 0.22 : remaining < 120_000 ? 0.05 : 0.01;
      if (Math.random() < p) {
        const rival = RIVALS[Math.floor(Math.random() * RIVALS.length)];
        if (db.bids[a.id][0]?.userId === rival.id) continue;
        const inc = [1000, 2000, 5000, 10000][Math.floor(Math.random() * 4)];
        try { placeBid(a.id, rival.id, rival.name, a.currentBid + inc); } catch { /* ignorar */ }
      }
    }
  }, 1000);
}
