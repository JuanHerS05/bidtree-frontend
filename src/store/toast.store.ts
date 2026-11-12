import { create } from 'zustand';

export interface Toast {
  id: number;
  kind: 'success' | 'info' | 'warning' | 'danger';
  title: string;
  message?: string;
  /** banner = aviso grande centrado (p. ej. "¡Te han superado!"). */
  variant?: 'toast' | 'banner';
  duration?: number;
  action?: { label: string; to: string };
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, 'id'>) => void;
  dismiss: (id: number) => void;
}

let n = 0;
export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (t) => {
    const id = ++n;
    set((s) => ({ toasts: [...s.toasts, { variant: 'toast', duration: 5000, ...t, id }] }));
    const d = t.duration ?? 5000;
    if (d > 0) setTimeout(() => get().dismiss(id), d);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

export const toast = {
  success: (title: string, message?: string) => useToastStore.getState().push({ kind: 'success', title, message }),
  info: (title: string, message?: string) => useToastStore.getState().push({ kind: 'info', title, message }),
  warning: (title: string, message?: string) => useToastStore.getState().push({ kind: 'warning', title, message }),
  error: (title: string, message?: string) => useToastStore.getState().push({ kind: 'danger', title, message }),
};
