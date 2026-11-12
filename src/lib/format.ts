import { APP } from '@/config/app.config';

const money = new Intl.NumberFormat(APP.locale, {
  style: 'currency', currency: APP.currency, maximumFractionDigits: 0,
});
export const formatMoney = (n: number) => money.format(n);
export const formatNumber = (n: number) => new Intl.NumberFormat(APP.locale).format(n);

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(APP.locale, { hour12: false });
export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString(APP.locale, { dateStyle: 'medium', timeStyle: 'short' });
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(APP.locale, { day: '2-digit', month: 'short', year: 'numeric' });

/** 125 → "02:05"; ≥1h → "1:02:05"; ≥1d → "2d 03h". */
export function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const p = (n: number) => String(n).padStart(2, '0');
  if (d > 0) return `${d}d ${p(h)}h`;
  if (h > 0) return `${h}:${p(m)}:${p(s)}`;
  return `${p(m)}:${p(s)}`;
}

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';

const AVATAR_COLORS = ['#0F5A47', '#10B981', '#FF6B00', '#F59E0B', '#6366F1', '#EC4899', '#0EA5E9'];
export const avatarColor = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};
