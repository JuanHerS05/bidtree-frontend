import { create } from 'zustand';
import type { AuctionStatus, Bid } from '@/lib/types';

export type Connection = 'connecting' | 'open' | 'closed';

interface RoomState {
  auctionId: string | null;
  currentBid: number;
  bidCount: number;
  endsAt: string | null;
  status: AuctionStatus;
  bids: Bid[];
  viewers: number;
  connection: Connection;
  /** Marca de tiempo del último +15 s (la UI destella al cambiar). */
  extendedAt: number;
  result: { winnerId: string | null; winnerName: string | null; finalPrice: number; orderId: string | null } | null;
  reset: (auctionId: string, init?: Partial<RoomState>) => void;
  patch: (p: Partial<RoomState>) => void;
  addBid: (bid: Bid, p: { endsAt: string; currentBid: number; bidCount: number; extended: boolean }) => void;
}

const empty = {
  currentBid: 0, bidCount: 0, endsAt: null, status: 'ACTIVE' as AuctionStatus, bids: [] as Bid[],
  viewers: 1, connection: 'connecting' as Connection, extendedAt: 0, result: null,
};

export const useRoomStore = create<RoomState>((set) => ({
  auctionId: null,
  ...empty,
  reset: (auctionId, init) => set({ auctionId, ...empty, ...init }),
  patch: (p) => set(p),
  addBid: (bid, p) =>
    set((s) => ({
      bids: s.bids.some((b) => b.id === bid.id) ? s.bids : [bid, ...s.bids].slice(0, 60),
      endsAt: p.endsAt, currentBid: p.currentBid, bidCount: p.bidCount,
      extendedAt: p.extended ? Date.now() : s.extendedAt,
    })),
}));
