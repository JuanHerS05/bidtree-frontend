import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import { APP } from '@/config/app.config';
import { useCountdown } from '@/hooks/useCountdown';
import { formatRemaining } from '@/lib/format';

/**
 * Cronómetro Anti-Sniping. Rojo + destello en los últimos 15 s; ámbar bajo 5 min.
 * `extendedAt` cambia cuando el servidor suma tiempo → se muestra "+15s".
 */
export function CountdownClock({ endsAt, ended, extendedAt = 0, size = 'xl' }:
  { endsAt?: string | null; ended?: boolean; extendedAt?: number; size?: 'md' | 'xl' }) {
  const ms = useCountdown(endsAt);
  const [showExt, setShowExt] = useState(false);
  useEffect(() => {
    if (!extendedAt) return;
    setShowExt(true);
    const t = setTimeout(() => setShowExt(false), 2200);
    return () => clearTimeout(t);
  }, [extendedAt]);

  const danger = !ended && ms > 0 && ms <= APP.antiSnipingWindowSeconds * 1000;
  const warn = !ended && !danger && ms <= APP.endingSoonMinutes * 60_000;
  const over = ended || ms <= 0;

  return (
    <div className="relative text-center" role="timer" aria-live="off">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{over ? 'Subasta finalizada' : 'Tiempo restante'}</p>
      <motion.div
        key={showExt ? 'flash' : 'steady'}
        animate={showExt ? { scale: [1, 1.12, 1], backgroundColor: ['rgba(239,68,68,.0)', 'rgba(239,68,68,.35)', 'rgba(239,68,68,.0)'] } : {}}
        transition={{ duration: 0.7 }}
        className={clsx(
          'num inline-block rounded-2xl px-6 py-2 font-bold leading-none',
          size === 'xl' ? 'text-6xl sm:text-7xl' : 'text-3xl',
          over ? 'text-slate-500' : danger ? 'animate-flashRed text-danger' : warn ? 'text-warn' : 'text-white',
          danger && 'drop-shadow-[0_0_18px_rgba(239,68,68,.55)]',
        )}
      >
        {over ? '00:00' : formatRemaining(ms)}
      </motion.div>
      <AnimatePresence>
        {showExt && (
          <motion.span initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="num absolute -right-1 top-5 rounded-full bg-danger px-2 py-0.5 text-xs font-bold text-white">
            +{APP.antiSnipingExtensionSeconds}s
          </motion.span>
        )}
      </AnimatePresence>
      {danger && <p className="mt-1 text-xs font-semibold text-danger">¡Últimos segundos! Cada puja suma +{APP.antiSnipingExtensionSeconds}s</p>}
    </div>
  );
}
