/**
 * Decide qué hace la UI cuando llega un evento de tópico. Usa `TOPICS` (config/topics.ts),
 * así que renombrar un tópico NO requiere cambios aquí.
 * Campos de payload esperados: ver cada `case`. Ajusta los nombres al contrato real.
 */
import type { QueryClient } from '@tanstack/react-query';
import { topicKeyByName } from '@/config/topics';
import { formatMoney } from '@/lib/format';
import type { User } from '@/lib/types';
import { useNotificationsStore } from '@/store/notifications.store';
import { useRoomStore } from '@/store/room.store';
import { useToastStore } from '@/store/toast.store';
import type { TopicEnvelope } from './notificationsChannel';

export function handleEnvelope({ topic, payload }: TopicEnvelope, qc: QueryClient, me: User | null) {
  const key = topicKeyByName(topic);
  if (!key || !me) return;
  const add = useNotificationsStore.getState().add;
  const push = useToastStore.getState().push;
  const mine = !payload.userId || payload.userId === me.id;

  switch (key) {
    case 'auctionEnded': {
      qc.invalidateQueries({ queryKey: ['auctions'] });
      if (payload.winnerId !== me.id) return;
      const link = `/checkout/${payload.orderId}`;
      add({ kind: 'AUCTION_WON', title: '¡Ganaste la subasta!', message: `${payload.title} por ${formatMoney(payload.amount)}. Completa tu pago.`, link });
      push({ kind: 'success', title: '¡Ganaste la subasta!', message: payload.title, duration: 9000, action: { label: 'Ir a pagar', to: link } });
      return;
    }
    case 'paymentRegistered': {
      qc.invalidateQueries({ queryKey: ['rewards'] });
      qc.invalidateQueries({ queryKey: ['auctions'] });
      if (!mine) return;
      add({ kind: 'PAYMENT_OK', title: 'Pago registrado', message: payload.points ? `Sumaste ${payload.points} puntos en tu Árbol.` : 'Tu pago fue confirmado.', link: '/rewards' });
      return;
    }
    case 'outbid': {
      if (!mine) return;
      const link = `/auctions/${payload.auctionId}/live`;
      add({ kind: 'OUTBID', title: '¡Te han superado!', message: `${payload.title}: nueva oferta de ${formatMoney(payload.amount)}.`, link });
      // Si ya estás en la sala, la sala muestra su propio banner.
      if (useRoomStore.getState().auctionId !== payload.auctionId)
        push({ kind: 'danger', variant: 'banner', title: '¡Te han superado!', message: `${payload.title} · ${formatMoney(payload.amount)}`, duration: 7000, action: { label: 'Volver a pujar', to: link } });
      return;
    }
    case 'priceLimitReached': {
      if (!mine) return;
      const link = `/auctions/${payload.auctionId}/live`;
      add({ kind: 'PRICE_LIMIT', title: 'Precio límite alcanzado', message: `${payload.title} llegó a ${formatMoney(payload.amount)} (tu límite: ${formatMoney(payload.threshold)}).`, link });
      push({ kind: 'warning', title: 'Precio límite alcanzado', message: payload.title, duration: 8000, action: { label: 'Ver subasta', to: link } });
      return;
    }
    case 'paymentReassignment': {
      if (!mine) return;
      const link = `/checkout/${payload.orderId}`;
      add({
        kind: 'PAYMENT_REASSIGN', title: 'Tienes una oportunidad de compra',
        message: `El comprador principal no pagó "${payload.title}". Como segundo mejor postor puedes comprarlo por ${formatMoney(payload.price)}.`,
        link, action: { label: 'Comprar ahora', orderId: payload.orderId, price: payload.price },
      });
      push({ kind: 'info', variant: 'banner', title: 'Oportunidad de compra directa', message: `${payload.title} · ${formatMoney(payload.price)}`, duration: 12000, action: { label: 'Comprar ahora', to: link } });
      return;
    }
    default:
      return;
  }
}
