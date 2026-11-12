import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, BellRing, CheckCircle2, Info, X } from 'lucide-react';
import clsx from 'clsx';
import { Link } from 'react-router-dom';
import { useToastStore, type Toast } from '@/store/toast.store';

const tone: Record<Toast['kind'], { box: string; icon: JSX.Element }> = {
  success: { box: 'border-mint bg-white text-slate-800', icon: <CheckCircle2 className="h-5 w-5 text-mint" /> },
  info: { box: 'border-brand bg-white text-slate-800', icon: <Info className="h-5 w-5 text-brand" /> },
  warning: { box: 'border-warn bg-white text-slate-800', icon: <AlertTriangle className="h-5 w-5 text-warn" /> },
  danger: { box: 'border-danger bg-white text-slate-800', icon: <BellRing className="h-5 w-5 text-danger" /> },
};

export function ToastHost() {
  const { toasts, dismiss } = useToastStore();
  const banners = toasts.filter((t) => t.variant === 'banner');
  const small = toasts.filter((t) => t.variant !== 'banner');
  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-16 z-[70] flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {banners.map((t) => (
            <motion.div key={t.id} layout initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -30, opacity: 0 }}
              role="alert" className={clsx('pointer-events-auto flex w-full max-w-xl items-center gap-3 rounded-xl px-5 py-4 text-white shadow-2xl', t.kind === 'danger' ? 'bg-danger' : t.kind === 'info' ? 'bg-brand' : 'bg-auction')}>
              <BellRing className="h-6 w-6 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-bold leading-tight">{t.title}</p>
                {t.message && <p className="truncate text-sm text-white/90">{t.message}</p>}
              </div>
              {t.action && <Link to={t.action.to} onClick={() => dismiss(t.id)} className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-slate-900">{t.action.label}</Link>}
              <button onClick={() => dismiss(t.id)} aria-label="Cerrar"><X className="h-5 w-5" /></button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[min(92vw,22rem)] flex-col gap-2">
        <AnimatePresence>
          {small.map((t) => (
            <motion.div key={t.id} layout initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 60, opacity: 0 }}
              role="status" className={clsx('pointer-events-auto flex items-start gap-3 rounded-xl border-l-4 p-3 shadow-xl', tone[t.kind].box)}>
              {tone[t.kind].icon}
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-semibold">{t.title}</p>
                {t.message && <p className="text-slate-600">{t.message}</p>}
                {t.action && <Link to={t.action.to} onClick={() => dismiss(t.id)} className="mt-1 inline-block font-semibold text-brand underline">{t.action.label}</Link>}
              </div>
              <button onClick={() => dismiss(t.id)} aria-label="Cerrar" className="text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
