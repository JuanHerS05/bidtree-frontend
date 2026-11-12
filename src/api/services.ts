/** Funciones de dominio: una por caso de uso. Los componentes nunca arman URLs ni tocan fetch. */
import { ENDPOINTS } from '@/config/endpoints';
import type {
  Auction, AuctionFilters, Bid, CreateAuctionInput, LoginResponse, Order, PayInput,
  RewardHistoryItem, RewardSummary, UserDTO,
} from '@/lib/types';
import { call } from './http';

export const authApi = {
  login: (email: string, password: string) =>
    call<LoginResponse>(ENDPOINTS.auth.login, { body: { email, password } }),
  register: (dto: UserDTO) => call<unknown>(ENDPOINTS.auth.register, { body: dto }),
  forgotPassword: (email: string) => call<unknown>(ENDPOINTS.auth.forgotPassword, { body: { email } }),
};

export const auctionsApi = {
  list: (f: AuctionFilters) => call<Auction[]>(ENDPOINTS.auctions.list, { query: { ...f } }),
  detail: (id: string) => call<Auction>(ENDPOINTS.auctions.detail, { params: { auction_id: id } }),
  mine: () => call<Auction[]>(ENDPOINTS.auctions.mine),
  create: (input: CreateAuctionInput) => call<Auction>(ENDPOINTS.auctions.create, { body: input }),
  cancel: (id: string) => call<unknown>(ENDPOINTS.auctions.cancel, { params: { auction_id: id } }),
  categories: () => call<string[]>(ENDPOINTS.auctions.categories),
  uploadImage: async (file: File) => {
    const fd = new FormData(); fd.append('file', file);
    return call<{ image_url: string }>(ENDPOINTS.auctions.uploadImage, { body: fd });
  },
};

export const bidsApi = {
  history: (id: string) => call<Bid[]>(ENDPOINTS.bids.history, { params: { auction_id: id } }),
  place: (auctionId: string, amount: number) => call<Bid>(ENDPOINTS.bids.place, { body: { auctionId, amount } }),
};

export const rewardsApi = {
  me: () => call<RewardSummary>(ENDPOINTS.rewards.me),
  history: () => call<RewardHistoryItem[]>(ENDPOINTS.rewards.history),
  redeem: (orderId: string, amount: number) =>
    call<{ discount: number; remaining: number }>(ENDPOINTS.rewards.redeem, { body: { orderId, amount } }),
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
