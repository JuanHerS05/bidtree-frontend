export type Role = 'BUYER' | 'SELLER';

export interface User { id: string; name: string; email: string; role: Role }

/** DTO de registro (ms-usuarios → UserDTO). Ajusta los nombres de campo al DTO real. */
export interface UserDTO {
  nombre: string;
  documento: string;
  email: string;
  telefono: string;
  password: string;
  rol: Role;
}

export interface LoginResponse { token: string; user?: User }

export type AuctionStatus = 'ACTIVE' | 'ENDED' | 'CANCELLED' | 'SOLD';

export interface Auction {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  gallery: string[];
  category: string;
  condition?: string;
  specs: Record<string, string>;
  basePrice: number;
  currentBid: number;
  bidCount: number;
  endsAt: string; // ISO
  createdAt: string;
  status: AuctionStatus;
  seller: { id: string; name: string };
  winner?: { id: string; name: string } | null;
  orderId?: string | null;
}

export interface AuctionFilters {
  q?: string;
  category?: string;
  min_price?: number;
  max_price?: number;
  ends_within_hours?: number;
}

export interface CreateAuctionInput {
  title: string;
  description: string;
  image_url: string;
  base_price: number;
  category: string;
  ends_at: string; // ISO
}

export interface Bid { id: string; auctionId: string; userId: string; userName: string; amount: number; at: string }

export interface RewardMilestone {
  id: string; title: string; points: number; description: string;
  state: 'UNLOCKED' | 'IN_PROGRESS' | 'LOCKED';
}
export interface RewardHistoryItem {
  id: string; date: string; action: string; points: number; result: string; credit?: number;
}
export interface RewardSummary {
  points: number;
  goal: number;
  /** Saldo a favor disponible en moneda local. */
  balance: number;
  milestones: RewardMilestone[];
}

export interface Order {
  id: string;
  auctionId: string;
  title: string;
  imageUrl: string;
  sellerName: string;
  finalPrice: number;
  availableCredit: number;
  status: 'PENDING' | 'PAID' | 'REASSIGNED';
}

export type PaymentMethod = 'CARD' | 'TRANSFER';
export interface PayInput {
  method: PaymentMethod;
  applyCredit: boolean;
  card?: { holder: string; number: string; expiry: string; cvc: string };
}

export type NotificationKind =
  | 'OUTBID' | 'PRICE_LIMIT' | 'AUCTION_WON' | 'PAYMENT_REASSIGN' | 'PAYMENT_OK' | 'GENERIC';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  message: string;
  at: string;
  read: boolean;
  link?: string;
  /** Acción especial (reasignación por fallo de pago). */
  action?: { label: string; orderId: string; price?: number };
}
