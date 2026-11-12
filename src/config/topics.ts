/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  NOMBRES DE TÓPICOS KAFKA Y EVENTOS WEBSOCKET                 ║
 * ╚══════════════════════════════════════════════════════════════╝
 * El navegador no habla con Kafka: recibe, por el canal de notificaciones
 * (WS ENDPOINTS.ws.notifications), sobres `{ topic, payload }` con el nombre del
 * tópico de origen. Para renombrar un tópico cambia su valor aquí o define la
 * variable VITE_TOPIC_* en `.env`. Ningún otro archivo usa los strings literales.
 */
import { getEnv } from './env';

export const TOPICS = {
  // ── Tópicos del documento ──
  /** ms-usuarios → ms-subastas / ms-pagos-alertas. El front no lo consume; se deja para referencia. */
  userCreated: getEnv('VITE_TOPIC_USER_CREATED') ?? 'user-created-topic',
  /** ms-pujas → ms-pagos-alertas. Aquí avisa al ganador para ir a pagar. */
  auctionEnded: getEnv('VITE_TOPIC_AUCTION_ENDED') ?? 'auction-ended',
  /** ms-pagos-alertas → ms-subastas. Aquí refresca puntos / saldo / catálogo. */
  paymentRegistered: getEnv('VITE_TOPIC_PAYMENT_REGISTERED') ?? 'payment-registered-topic',
  // ── Eventos de alertas (propuestos para la UI; renómbralos según tu backend) ──
  outbid: getEnv('VITE_TOPIC_OUTBID') ?? 'outbid-topic',
  priceLimitReached: getEnv('VITE_TOPIC_PRICE_LIMIT') ?? 'price-limit-reached-topic',
  paymentReassignment: getEnv('VITE_TOPIC_PAYMENT_REASSIGNMENT') ?? 'payment-reassignment-topic',
} as const;

export type TopicKey = keyof typeof TOPICS;

export const topicKeyByName = (name: string): TopicKey | undefined =>
  (Object.keys(TOPICS) as TopicKey[]).find((k) => TOPICS[k] === name);

/**
 * Tipos de mensaje del WebSocket de la sala `/ws/auction/{id}`.
 * Clave = nombre interno usado por la UI, valor = texto que envía/recibe el backend.
 */
export const WS_EVENTS = {
  snapshot: 'SNAPSHOT',
  newBid: 'NEW_BID',
  timeExtended: 'TIME_EXTENDED',
  auctionEnded: 'AUCTION_ENDED',
  viewers: 'VIEWERS',
  error: 'ERROR',
  /** cliente → servidor */
  placeBid: 'PLACE_BID',
} as const;

export type WsEventKey = keyof typeof WS_EVENTS;
export const wsEventKeyByName = (name: string): WsEventKey | undefined =>
  (Object.keys(WS_EVENTS) as WsEventKey[]).find((k) => WS_EVENTS[k] === name);
