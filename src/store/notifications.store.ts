import { create } from 'zustand';
import type { AppNotification } from '@/lib/types';

interface NState {
  items: AppNotification[];
  add: (n: Omit<AppNotification, 'id' | 'at' | 'read'> & Partial<Pick<AppNotification, 'id' | 'at'>>) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clear: () => void;
}

export const useNotificationsStore = create<NState>((set) => ({
  items: [],
  add: (n) =>
    set((s) => ({
      items: [{ id: n.id ?? `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, at: n.at ?? new Date().toISOString(), read: false, ...n }, ...s.items].slice(0, 50),
    })),
  markAllRead: () => set((s) => ({ items: s.items.map((i) => ({ ...i, read: true })) })),
  markRead: (id) => set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, read: true } : i)) })),
  clear: () => set({ items: [] }),
}));
