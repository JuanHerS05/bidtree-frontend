import { useQuery } from '@tanstack/react-query';
import { auctionsApi, ordersApi, rewardsApi } from '@/api/services';
import { APP } from '@/config/app.config';
import type { AuctionFilters } from '@/lib/types';

export const useAuctions = (f: AuctionFilters) =>
  useQuery({ queryKey: ['auctions', 'list', f], queryFn: () => auctionsApi.list(f), refetchInterval: APP.catalogRefetchMs, placeholderData: (p) => p });
export const useAuction = (id: string) =>
  useQuery({ queryKey: ['auctions', 'detail', id], queryFn: () => auctionsApi.detail(id) });
export const useMyAuctions = () =>
  useQuery({ queryKey: ['auctions', 'mine'], queryFn: auctionsApi.mine, refetchInterval: 5000 });
export const useCategories = () =>
  useQuery({ queryKey: ['categories'], queryFn: auctionsApi.categories, staleTime: 60_000 });
export const useRewards = () => useQuery({ queryKey: ['rewards', 'me'], queryFn: rewardsApi.me });
export const useRewardHistory = () => useQuery({ queryKey: ['rewards', 'history'], queryFn: rewardsApi.history });
export const useOrder = (id: string) => useQuery({ queryKey: ['orders', id], queryFn: () => ordersApi.detail(id) });
