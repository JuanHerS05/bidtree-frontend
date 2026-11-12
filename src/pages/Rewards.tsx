import { motion } from 'framer-motion';
import { CheckCircle2, Lock, Sprout, Trophy } from 'lucide-react';
import clsx from 'clsx';
import { AnimateNumber } from '@/components/AnimateNumber';
import { RewardTree } from '@/components/RewardTree';
import { EmptyState, Skeleton } from '@/components/ui';
import { useRewardHistory, useRewards } from '@/hooks/queries';
import { formatDate, formatMoney, formatNumber } from '@/lib/format';

/** Mi Árbol de Puntos (`/rewards`). */
export default function Rewards() {
  const { data: r, isLoading, isError } = useRewards();
  const { data: history } = useRewardHistory();
  if (isLoading) return <Skeleton className="h-96" />;
  if (isError || !r) return <EmptyState title="No pudimos cargar tus recompensas" />;
  const progress = Math.min(1, r.points / r.goal);
  const pct = Math.round(progress * 100);

  return (
    <div className="space-y-6">
      <h1 className="text-h1 text-slate-900">Mi Árbol de Puntos</h1>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-3xl bg-gradient-to-b from-mint-50 to-white p-6 ring-1 ring-mint/30">
          <RewardTree progress={progress} />
          <div className="mx-auto max-w-md space-y-3">
            <p className="text-center font-display text-sm font-bold uppercase tracking-widest text-brand">Tus puntos</p>
            <p className="text-center"><AnimateNumber value={r.points} format={formatNumber} className="text-5xl font-bold text-brand" /><span className="num ml-2 text-xl text-slate-400">/ {formatNumber(r.goal)}</span></p>
            <div className="h-3 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso hacia la meta de puntos">
              <motion.div className="h-full rounded-full bg-mint" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9, ease: 'easeOut' }} />
            </div>
            <p className="text-center text-sm text-slate-600">{pct}% · Te faltan <strong className="num">{formatNumber(Math.max(0, r.goal - r.points))}</strong> puntos para convertirlos <strong>automáticamente</strong> en saldo a favor.</p>
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-2xl bg-brand p-6 text-white">
            <p className="text-sm text-white/80">Saldo a favor disponible</p>
            <AnimateNumber value={r.balance} className="text-4xl font-bold" />
            <p className="mt-1 text-xs text-white/70">Se aplica como descuento en tu próximo pago (Checkout → “Aplicar saldo a favor”).</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 flex items-center gap-2 text-h3 text-slate-900"><Trophy className="h-5 w-5 text-auction" />Hitos de recompensa</h2>
            <ul className="space-y-2">
              {r.milestones.map((m) => (
                <li key={m.id} className={clsx('flex items-center gap-3 rounded-xl border p-3', m.state === 'UNLOCKED' ? 'border-mint bg-mint-50' : m.state === 'IN_PROGRESS' ? 'border-brand bg-white' : 'border-slate-200 bg-slate-50 opacity-70')}>
                  <span className={clsx('flex h-9 w-9 items-center justify-center rounded-full', m.state === 'LOCKED' ? 'bg-slate-200 text-slate-500' : 'bg-mint text-white')}>
                    {m.state === 'UNLOCKED' ? <CheckCircle2 className="h-5 w-5" /> : m.state === 'IN_PROGRESS' ? <Sprout className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-900">{m.title}</p><p className="truncate text-xs text-slate-500">{m.description}</p></div>
                  <span className="num text-xs font-semibold text-slate-500">{formatNumber(m.points)} pts</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white">
        <h2 className="border-b px-5 py-4 text-h3 text-slate-900">Historial de conversiones</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Fecha</th><th className="px-5 py-3">Acción</th><th className="px-5 py-3 text-right">Puntos</th><th className="px-5 py-3">Resultado</th></tr></thead>
            <tbody className="divide-y">
              {(history ?? []).map((h) => (
                <tr key={h.id}>
                  <td className="px-5 py-3 text-slate-600">{formatDate(h.date)}</td>
                  <td className="px-5 py-3">{h.action}</td>
                  <td className={clsx('num px-5 py-3 text-right font-semibold', h.points >= 0 ? 'text-mint' : 'text-danger')}>{h.points >= 0 ? '+' : ''}{formatNumber(h.points)}</td>
                  <td className="px-5 py-3">{h.credit ? <span className="font-semibold text-brand">{formatMoney(h.credit)} de saldo</span> : h.result}</td>
                </tr>
              ))}
              {history?.length === 0 && <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-500">Aún no tienes movimientos. Gana subastas para sumar puntos.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
