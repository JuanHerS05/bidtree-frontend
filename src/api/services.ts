/** Funciones de dominio: una por caso de uso. Los componentes nunca arman URLs ni tocan fetch. */
import { ENDPOINTS } from '@/config/endpoints';
import type {
  Auction, AuctionFilters, Bid, CreateAuctionInput, LoginResponse, Order, PayInput,
  RewardHistoryItem, RewardSummary, UserDTO,
} from '@/lib/types';
import { useAuthStore } from '@/store/auth.store';
import { call, ApiError } from './http';

/* ───────────── Helpers para ms-subastas ───────────── */

const uid = () => {
  const id = useAuthStore.getState().user?.id;
  if (!id) throw new ApiError('Sesión no iniciada', 401);
  return id;
};

// El backend devuelve fechas sin zona horaria; se asume UTC.
const iso = (s: string) => (/Z|[+-]\d\d:?\d\d$/.test(s) ? s : s + 'Z');

interface AuctionDTO {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  image_url: string;
  base_price: number;
  current_price: number;
  category: string;
  status: 'ACTIVE' | 'FINISHED' | 'CANCELLED' | 'PENDING';
  bid_count: number;
  winner_id: string | null;
  expiration_at: string;
  created_at: string;
}

const toAuction = (d: AuctionDTO): Auction => ({
  id: d.id,
  title: d.title,
  description: d.description,
  imageUrl: d.image_url,
  gallery: [d.image_url],
  category: d.category,
  specs: {},
  basePrice: d.base_price,
  currentBid: d.current_price,
  bidCount: d.bid_count,
  endsAt: iso(d.expiration_at),
  createdAt: iso(d.created_at),
  status: d.status === 'ACTIVE' ? 'ACTIVE' : d.status === 'CANCELLED' ? 'CANCELLED' : 'ENDED',
  seller: { id: d.seller_id, name: 'Vendedor' },
  winner: d.winner_id ? { id: d.winner_id, name: 'Ganador' } : null,
});

/* ───────────── APIs ───────────── */

export const authApi = {
  login: (email: string, password: string) =>
    call<LoginResponse>(ENDPOINTS.auth.login, { body: { email, password } }),
  register: (dto: UserDTO) => call<unknown>(ENDPOINTS.auth.register, { body: dto }),
  forgotPassword: (email: string) => call<unknown>(ENDPOINTS.auth.forgotPassword, { body: { email } }),
};

export const auctionsApi = {
  list: async (f: AuctionFilters) => {
    const data = await call<AuctionDTO[]>(ENDPOINTS.auctions.list, {
      query: { category: f.category, min_price: f.min_price, max_price: f.max_price },
    });
    let r = data.map(toAuction);
    // El backend no soporta estos dos filtros: se aplican en el cliente.
    if (f.q) {
      const q = f.q.toLowerCase();
      r = r.filter((a) => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q));
    }
    if (f.ends_within_hours) {
      const limit = Date.now() + f.ends_within_hours * 3_600_000;
      r = r.filter((a) => new Date(a.endsAt).getTime() <= limit);
    }
    return r;
  },

  // ms-subastas no tiene GET /auctions/{id}: se busca dentro del catálogo (solo subastas ACTIVE).
  detail: async (id: string) => {
    const a = (await auctionsApi.list({})).find((x) => x.id === id);
    if (!a) throw new ApiError('Subasta no encontrada', 404);
    return a;
  },

  mine: async () => {
    const d = await call<{ active_auctions: AuctionDTO[]; finished_auctions: AuctionDTO[] }>(
      ENDPOINTS.auctions.mine,
      { params: { seller_id: uid() } },
    );
    return [...d.active_auctions, ...d.finished_auctions].map(toAuction);
  },

  create: async (input: CreateAuctionInput) =>
    toAuction(
      await call<AuctionDTO>(ENDPOINTS.auctions.create, {
        body: {
          seller_id: uid(),
          title: input.title,
          description: input.description,
          image_url: input.image_url,
          base_price: input.base_price,
          category: input.category,
          expiration_at: input.ends_at,
        },
      }),
    ),

  cancel: (id: string) =>
    call<unknown>(ENDPOINTS.auctions.cancel, { params: { auction_id: id }, query: { seller_id: uid() } }),

  // No existe endpoint de categorías: se derivan del catálogo.
  categories: async () => [...new Set((await auctionsApi.list({})).map((a) => a.category))],

  // No existe endpoint de subida: la imagen viaja como data URL dentro de image_url.
  uploadImage: (file: File) =>
    new Promise<{ image_url: string }>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ image_url: String(reader.result) });
      reader.onerror = () => reject(new ApiError('No se pudo leer la imagen', 0));
      reader.readAsDataURL(file);
    }),
};

export const bidsApi = {
  history: (id: string) => call<Bid[]>(ENDPOINTS.bids.history, { params: { auction_id: id } }),
  place: (auctionId: string, amount: number) => call<Bid>(ENDPOINTS.bids.place, { body: { auctionId, amount } }),
};

export const rewardsApi = {
  me: async (): Promise<RewardSummary> => {
    const d = await call<{ accumulated_points: number; target_points: number; available_balance: number }>(
      ENDPOINTS.rewards.me,
      { params: { user_id: uid() } },
    );
    return { points: d.accumulated_points, goal: d.target_points, balance: d.available_balance, milestones: [] };
  },

  // No existe endpoint de historial en ms-subastas.
  history: async (): Promise<RewardHistoryItem[]> => [],

  // El backend pide auction_id; el frontend trabaja con orderId, así que se consulta la orden primero.
  redeem: async (orderId: string, amount: number) => {
    const order = await ordersApi.detail(orderId);
    const r = await call<{ redeemed_amount: number; remaining_balance: number }>(ENDPOINTS.rewards.redeem, {
      body: { user_id: uid(), amount_to_redeem: amount, auction_id: order.auctionId },
    });
    return { discount: r.redeemed_amount, remaining: r.remaining_balance };
  },
};

export const ordersApi = {
  detail: (id: string) => call<Order>(ENDPOINTS.orders.detail, { params: { order_id: id } }),
  pay: (id: string, input: PayInput) => call<{ ok: boolean; paid: number; pointsEarned: number }>(ENDPOINTS.orders.pay, { params: { order_id: id }, body: input }),
  acceptReassignment: (id: string) => call<Order>(ENDPOINTS.orders.acceptReassignment, { params: { order_id: id } }),
};

export const alertsApi = {
  setPriceLimit: (auctionId: string, threshold: number) =>
    call<unknown>(ENDPOINTS.alerts.setPriceLimit, { body: { auctionId, threshold } }),
};