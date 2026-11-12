import { useCallback, useEffect, useRef } from 'react';
import { openAuctionChannel, type AuctionChannel } from '@/realtime/auctionChannel';
import { useAuthStore } from '@/store/auth.store';
import { useNotificationsStore } from '@/store/notifications.store';
import { useRoomStore } from '@/store/room.store';
import { toast, useToastStore } from '@/store/toast.store';
import { formatMoney } from '@/lib/format';

/** Conecta la sala `/ws/auction/{id}` y sincroniza el store de pujas en vivo. */
export function useAuctionRoom(auctionId: string, auctionTitle?: string) {
  const channel = useRef<AuctionChannel | null>(null);
  const title = useRef(auctionTitle);
  title.current = auctionTitle;

  useEffect(() => {
    useRoomStore.getState().reset(auctionId);
    const ch = openAuctionChannel(auctionId, {
      onStatus: (connection) => useRoomStore.getState().patch({ connection }),
      onMessage: (m) => {
        const room = useRoomStore.getState();
        switch (m.kind) {
          case 'snapshot':
            room.patch({ currentBid: m.currentBid, bidCount: m.bidCount, endsAt: m.endsAt, status: m.status, bids: m.bids, viewers: m.viewers ?? room.viewers });
            break;
          case 'bid': {
            const me = useAuthStore.getState().user;
            const prevLeader = room.bids[0]?.userId;
            if (me && prevLeader === me.id && m.bid.userId !== me.id) {
              useToastStore.getState().push({ kind: 'danger', variant: 'banner', title: '¡Te han superado!', message: `${m.bid.userName} ofertó ${formatMoney(m.bid.amount)}`, duration: 5000 });
              useNotificationsStore.getState().add({ kind: 'OUTBID', title: '¡Te han superado!', message: `${title.current ?? 'Subasta'}: ${formatMoney(m.bid.amount)} por ${m.bid.userName}.`, link: `/auctions/${auctionId}/live` });
            }
            room.addBid(m.bid, m);
            break;
          }
          case 'extended': room.patch({ endsAt: m.endsAt, extendedAt: Date.now() }); break;
          case 'viewers': room.patch({ viewers: m.viewers }); break;
          case 'ended':
            room.patch({ status: 'ENDED', result: { winnerId: m.winnerId, winnerName: m.winnerName, finalPrice: m.finalPrice, orderId: m.orderId } });
            break;
          case 'error': toast.error('No se pudo pujar', m.message); break;
        }
      },
    });
    channel.current = ch;
    return () => { ch.close(); channel.current = null; useRoomStore.getState().reset(''); };
  }, [auctionId]);

  const sendBid = useCallback((amount: number) => channel.current?.sendBid(amount), []);
  return { sendBid };
}
