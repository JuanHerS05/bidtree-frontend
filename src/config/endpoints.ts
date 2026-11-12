/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  CATÁLOGO ÚNICO DE ENDPOINTS                                  ║
 * ╚══════════════════════════════════════════════════════════════╝
 * Cada endpoint declara: microservicio dueño, método y ruta.
 * Si el backend cambia una ruta, se cambia SOLO aquí.
 * Los parámetros de ruta se escriben como {nombre}.
 *
 * Rutas tomadas del documento: DELETE /api/v1/auctions/{auction_id}/cancel,
 * POST /api/v1/rewards/redeem y WS /ws/auction/{subasta_id}.
 * El resto son propuestas razonables: ajústalas al contrato real de tu backend.
 */
import type { ServiceKey } from './services';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export interface Endpoint { service: ServiceKey; method: HttpMethod; path: string }

const ep = (service: ServiceKey, method: HttpMethod, path: string): Endpoint => ({ service, method, path });

export const ENDPOINTS = {
  auth: {
    login: ep('usuarios', 'POST', '/api/v1/auth/login'),
    register: ep('usuarios', 'POST', '/api/v1/users'), // recibe UserDTO
    forgotPassword: ep('usuarios', 'POST', '/api/v1/auth/forgot-password'),
  },
  auctions: {
    list: ep('subastas', 'GET', '/api/v1/auctions'), // ?q&category&min_price&max_price&ends_within_hours
    detail: ep('subastas', 'GET', '/api/v1/auctions/{auction_id}'),
    mine: ep('subastas', 'GET', '/api/v1/auctions/mine'),
    create: ep('subastas', 'POST', '/api/v1/auctions'),
    cancel: ep('subastas', 'DELETE', '/api/v1/auctions/{auction_id}/cancel'),
    uploadImage: ep('subastas', 'POST', '/api/v1/auctions/image'), // multipart → { image_url }
    categories: ep('subastas', 'GET', '/api/v1/auctions/categories'),
  },
  bids: {
    place: ep('pujas', 'POST', '/api/v1/bids'), // respaldo REST si el WebSocket no está disponible
    history: ep('pujas', 'GET', '/api/v1/auctions/{auction_id}/bids'),
  },
  rewards: {
    me: ep('subastas', 'GET', '/api/v1/rewards/me'),
    history: ep('subastas', 'GET', '/api/v1/rewards/history'),
    redeem: ep('subastas', 'POST', '/api/v1/rewards/redeem'),
  },
  orders: {
    detail: ep('pagosAlertas', 'GET', '/api/v1/orders/{order_id}'),
    pay: ep('pagosAlertas', 'POST', '/api/v1/orders/{order_id}/pay'),
    acceptReassignment: ep('pagosAlertas', 'POST', '/api/v1/orders/{order_id}/accept-reassignment'),
  },
  alerts: {
    setPriceLimit: ep('pagosAlertas', 'POST', '/api/v1/alerts/price-limit'), // Configurar_Precio_Limite
    notifications: ep('pagosAlertas', 'GET', '/api/v1/notifications'),
    markRead: ep('pagosAlertas', 'PATCH', '/api/v1/notifications/{notification_id}/read'),
  },
  /** Canales WebSocket. */
  ws: {
    auction: ep('pujas', 'GET', '/ws/auction/{subasta_id}'),
    notifications: ep('pagosAlertas', 'GET', '/ws/notifications'),
  },
} as const;

/** Sustituye {param} en una ruta. */
export function buildPath(template: string, params: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => {
    if (!(k in params)) throw new Error(`Falta el parámetro de ruta "${k}" en ${template}`);
    return encodeURIComponent(String(params[k]));
  });
}
