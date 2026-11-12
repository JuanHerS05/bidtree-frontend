import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, BellRing, Gavel, ShoppingBag, Trophy, Wallet, CircleDollarSign } from 'lucide-react';
import clsx from 'clsx';
import { useNotificationsStore } from '@/store/notifications.store';
import { formatTime } from '@/lib/format';
import type { NotificationKind } from '@/lib/types';
import { Button } from './ui';

const icons: Record<NotificationKind, JSX.Element> = {
  OUTBID: <Gavel className="h-4 w-4 text-danger" />, PRICE_LIMIT: <CircleDollarSign className="h-4 w-4 text-warn" />,
  AUCTION_WON: <Trophy className="h-4 w-4 text-mint" />, PAYMENT_REASSIGN: <ShoppingBag className="h-4 w-4 text-auction" />,
  PAYMENT_OK: <Wallet className="h-4 w-4 text-brand" />, GENERIC: <BellRing className="h-4 w-4 text-slate-500" />,
};

export function NotificationCenter() {
  const { items, markAllRead, markRead, clear } = useNotificationsStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const nav = useNavigate();
  const unread = items.filter((i) => !i.read).length;

  useEffect(() => {
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-label={`Notificaciones (${unread} sin leer)`} className="relative rounded-full p-2 text-white/90 hover:bg-white/10">
        <Bell className="h-5 w-5" />
        {unread > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-auction px-1 text-[10px] font-bold text-white">{unread}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="absolute right-0 z-50 mt-2 w-[min(92vw,24rem)] overflow-hidden rounded-2xl bg-white text-slate-800 shadow-2xl ring-1 ring-black/5">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="font-semibold">Centro de notificaciones</h3>
              <div className="flex gap-3 text-xs font-medium text-brand">
                <button onClick={markAllRead}>Marcar leídas</button>
                <button onClick={clear} className="text-slate-500">Limpiar</button>
              </div>
            </div>
            <ul className="thin-scroll max-h-96 divide-y overflow-y-auto">
              {items.length === 0 && <li className="px-4 py-10 text-center text-sm text-slate-500">Aún no tienes notificaciones.</li>}
              {items.map((n) => (
                <li key={n.id} className={clsx('px-4 py-3', !n.read && 'bg-mint-50/70')}>
                  <div className="flex gap-3">
                    <span className="mt-0.5">{icons[n.kind]}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{n.title}</p>
                      <p className="text-sm text-slate-600">{n.message}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                        <span className="num">{formatTime(n.at)}</span>
                        {n.link && !n.action && <Link to={n.link} onClick={() => { markRead(n.id); setOpen(false); }} className="font-semibold text-brand">Ver</Link>}
                      </div>
                      {n.action && (
                        <Button size="sm" variant="accent" className="mt-2" onClick={() => { markRead(n.id); setOpen(false); nav(`/checkout/${n.action!.orderId}`); }}>
                          {n.action.label}
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
