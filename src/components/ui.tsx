import { forwardRef, useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, X } from 'lucide-react';
import clsx from 'clsx';
import { avatarColor, initials } from '@/lib/format';

type Variant = 'primary' | 'accent' | 'outline' | 'ghost' | 'danger';
const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-700 shadow-sm',
  accent: 'bg-auction text-white hover:bg-auction-600 shadow-sm',
  outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
  ghost: 'text-slate-600 hover:bg-slate-100',
  danger: 'bg-danger text-white hover:bg-red-600',
};

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant; size?: 'sm' | 'md' | 'lg'; loading?: boolean; full?: boolean;
}
export function Button({ variant = 'primary', size = 'md', loading, full, className, children, disabled, ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' && 'px-3 py-1.5 text-sm', size === 'md' && 'px-4 py-2.5 text-sm', size === 'lg' && 'px-5 py-3.5 text-base',
        full && 'w-full', variants[variant], className,
      )}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

interface FieldProps { label?: string; error?: string; hint?: string }
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & FieldProps & { dark?: boolean; glass?: boolean }>(
  ({ label, error, hint, className, dark, glass, id, ...rest }, ref) => {
    const fid = id ?? rest.name;
    return (
      <div className="w-full">
        {label && <label htmlFor={fid} className={clsx('mb-1 block text-sm font-medium', glass ? 'text-white/90' : dark ? 'text-slate-300' : 'text-slate-700')}>{label}</label>}
        <input
          ref={ref} id={fid} {...rest}
          aria-invalid={!!error}
          className={clsx(
            'w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-mint/60',
            glass ? 'border-white/30 bg-white/10 text-white placeholder:text-white/50'
              : dark ? 'border-slate-700 bg-slate-900 text-white placeholder:text-slate-500'
              : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400',
            error && 'border-danger', className,
          )}
        />
        {error ? <p className="mt-1 text-xs text-danger">{error}</p> : hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
      </div>
    );
  },
);

export function Select({ label, error, className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & FieldProps) {
  return (
    <div className="w-full">
      {label && <label htmlFor={rest.id ?? rest.name} className="mb-1 block text-sm font-medium text-slate-700">{label}</label>}
      <select {...rest} id={rest.id ?? rest.name} className={clsx('w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-mint/60', error && 'border-danger', className)}>
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean }) {
  return (
    <button
      type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx('relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50', checked ? 'bg-mint' : 'bg-slate-300')}
    >
      <span className={clsx('inline-block h-5 w-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-5' : 'translate-x-0.5')} />
    </button>
  );
}

const badgeTone = {
  live: 'bg-mint text-white', soon: 'bg-warn text-white', neutral: 'bg-slate-200 text-slate-700',
  new: 'bg-brand text-white', danger: 'bg-danger text-white', ok: 'bg-mint-50 text-brand',
} as const;
export function Badge({ tone = 'neutral', children, className }: { tone?: keyof typeof badgeTone; children: ReactNode; className?: string }) {
  return <span className={clsx('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold', badgeTone[tone], className)}>{children}</span>;
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: avatarColor(name), fontSize: size * 0.38 }} aria-hidden>
      {initials(name)}
    </span>
  );
}

export const Skeleton = ({ className }: { className?: string }) => <div className={clsx('animate-pulse rounded-lg bg-slate-200/80', className)} />;
export const Spinner = () => <Loader2 className="h-6 w-6 animate-spin text-brand" />;

export function EmptyState({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      {icon && <div className="text-slate-400">{icon}</div>}
      <h3 className="text-h3 text-slate-800">{title}</h3>
      {children && <div className="max-w-md text-sm text-slate-500">{children}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-night/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
          <motion.div role="dialog" aria-modal="true" aria-label={title}
            className={clsx('max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white p-6 text-slate-800 shadow-2xl', wide ? 'max-w-2xl' : 'max-w-md')}
            initial={{ y: 24, scale: 0.97, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 12, opacity: 0 }}
            onMouseDown={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 className="text-h2 text-brand">{title}</h2>
              <button onClick={onClose} aria-label="Cerrar" className="rounded-md p-1 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
