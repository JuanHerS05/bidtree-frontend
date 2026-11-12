import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Banknote, CheckCircle2, CreditCard, Landmark, Lock, PartyPopper } from 'lucide-react';
import clsx from 'clsx';
import { ordersApi, rewardsApi } from '@/api/services';
import { Button, EmptyState, Input, Skeleton, Switch } from '@/components/ui';
import { useOrder } from '@/hooks/queries';
import { formatMoney } from '@/lib/format';
import type { PaymentMethod } from '@/lib/types';
import { toast } from '@/store/toast.store';

const luhn = (n: string) => {
  const d = n.replace(/\D/g, '');
  if (d.length < 13) return false;
  let s = 0;
  d.split('').reverse().forEach((c, i) => { let x = +c; if (i % 2) { x *= 2; if (x > 9) x -= 9; } s += x; });
  return s % 10 === 0;
};

/** Checkout y Pagar (`/checkout/:orderId`). */
export default function Checkout() {
  const { orderId = '' } = useParams();
  const qc = useQueryClient();
  const { data: order, isLoading, isError } = useOrder(orderId);
  const [applyCredit, setApplyCredit] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>('CARD');
  const [card, setCard] = useState({ holder: '', number: '', expiry: '', cvc: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<{ paid: number; pointsEarned: number } | null>(null);

  const pay = useMutation({
    mutationFn: async () => {
      // 1) Reserva el descuento en ms-subastas  2) registra el pago en ms-pagos-alertas.
      if (applyCredit && discount > 0) await rewardsApi.redeem(orderId, discount);
      // Los datos de tarjeta deben ir a tu pasarela/tokenizador; aquí solo viajan en la petición de pago.
      return ordersApi.pay(orderId, { method, applyCredit, card: method === 'CARD' ? card : undefined });
    },
    onSuccess: (r) => { setDone(r); qc.invalidateQueries({ queryKey: ['rewards'] }); qc.invalidateQueries({ queryKey: ['orders'] }); },
    onError: (e: Error) => toast.error('El pago no pudo completarse', e.message),
  });

  if (isLoading) return <Skeleton className="mx-auto h-[32rem] max-w-xl" />;
  if (isError || !order) return <EmptyState title="Orden no encontrada"><Link to="/auctions" className="font-semibold text-brand underline">Volver al catálogo</Link></EmptyState>;

  const subtotal = order.finalPrice;
  const discount = applyCredit ? Math.min(order.availableCredit, subtotal) : 0;
  const total = subtotal - discount;
  const alreadyPaid = order.status === 'PAID';

  if (done || alreadyPaid) {
    return (
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mx-auto max-w-md rounded-3xl bg-white p-10 text-center shadow-lg ring-1 ring-slate-200">
        <PartyPopper className="mx-auto h-12 w-12 text-auction" />
        <h1 className="mt-3 text-h2 text-brand">{done ? '¡Pago confirmado!' : 'Esta orden ya fue pagada'}</h1>
        {done && <p className="mt-2 text-sm text-slate-600">Pagaste <strong className="num">{formatMoney(done.paid)}</strong> y sumaste <strong className="num text-mint">+{done.pointsEarned}</strong> puntos en tu Árbol.</p>}
        <div className="mt-6 flex justify-center gap-3"><Link to="/rewards"><Button>Ver mi Árbol</Button></Link><Link to="/auctions"><Button variant="outline">Seguir pujando</Button></Link></div>
      </motion.div>
    );
  }

  const submit = () => {
    const er: Record<string, string> = {};
    if (method === 'CARD') {
      if (card.holder.trim().length < 3) er.holder = 'Nombre del titular';
      if (!luhn(card.number)) er.number = 'Número de tarjeta no válido';
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry)) er.expiry = 'MM/AA';
      if (!/^\d{3,4}$/.test(card.cvc)) er.cvc = 'CVC';
    }
    setErrors(er);
    if (!Object.keys(er).length) pay.mutate();
  };
  const fmtNumber = (v: string) => v.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim();
  const fmtExpiry = (v: string) => { const d = v.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; };

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div><Link to="/auctions" className="text-sm text-slate-500 hover:text-brand">‹ Catálogo</Link><h1 className="text-h1 text-slate-900">Checkout y Pagar</h1></div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between border-b pb-3"><h2 className="font-semibold">Resumen de la orden</h2><span className="text-xs text-slate-500">Orden {order.id}</span></div>
        <div className="mt-4 flex gap-4">
          <img src={order.imageUrl} alt="" className="h-20 w-20 rounded-xl object-cover" />
          <div className="min-w-0 flex-1"><p className="font-semibold text-slate-900">{order.title}</p><p className="text-sm text-slate-500">Vendedor: {order.sellerName}</p><p className="text-sm text-slate-500">Monto de oferta final pactado</p></div>
          <p className="num text-lg font-bold text-brand">{formatMoney(order.finalPrice)}</p>
        </div>
      </section>

      <section className={clsx('flex items-center justify-between gap-4 rounded-2xl border p-4 transition-colors', applyCredit ? 'border-mint bg-mint-50' : 'border-slate-200 bg-white')}>
        <div><p className="font-semibold text-slate-900">Aplicar saldo a favor</p><p className="text-sm text-slate-600">Disponible: <span className="num font-semibold text-brand">{formatMoney(order.availableCredit)}</span></p></div>
        <Switch checked={applyCredit} onChange={setApplyCredit} label="Aplicar saldo a favor" disabled={order.availableCredit <= 0} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">Desglose del precio</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-slate-600">Subtotal producto</dt><dd className="num">{formatMoney(subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-600">Descuento por recompensas</dt><dd className={clsx('num', discount > 0 && 'font-semibold text-mint')}>{discount > 0 ? '−' : ''}{formatMoney(discount)}</dd></div>
          <div className="flex justify-between border-t pt-3 text-base"><dt className="font-semibold">Total a pagar</dt><dd className="num text-xl font-bold text-brand">{formatMoney(total)}</dd></div>
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">Método de pago</h2>
        <div className="space-y-3" role="radiogroup" aria-label="Método de pago">
          {([['CARD', 'Tarjeta de crédito / débito', CreditCard], ['TRANSFER', 'Transferencia bancaria', Landmark]] as const).map(([k, label, Icon]) => (
            <div key={k} className={clsx('rounded-xl border p-4', method === k ? 'border-mint bg-mint-50' : 'border-slate-200')}>
              <button type="button" role="radio" aria-checked={method === k} onClick={() => setMethod(k)} className="flex w-full items-center gap-3 text-left text-sm font-semibold">
                <span className={clsx('flex h-4 w-4 items-center justify-center rounded-full border-2', method === k ? 'border-brand' : 'border-slate-300')}>{method === k && <span className="h-2 w-2 rounded-full bg-brand" />}</span>
                <Icon className="h-4 w-4 text-slate-600" />{label}
              </button>
              {k === 'CARD' && method === 'CARD' && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="col-span-2"><Input label="Titular" autoComplete="cc-name" value={card.holder} onChange={(e) => setCard({ ...card, holder: e.target.value })} error={errors.holder} /></div>
                  <div className="col-span-2"><Input label="Número de tarjeta" inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000" value={card.number} onChange={(e) => setCard({ ...card, number: fmtNumber(e.target.value) })} error={errors.number} /></div>
                  <Input label="Vence" autoComplete="cc-exp" placeholder="MM/AA" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: fmtExpiry(e.target.value) })} error={errors.expiry} />
                  <Input label="CVC" inputMode="numeric" autoComplete="cc-csc" maxLength={4} value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '') })} error={errors.cvc} />
                </div>
              )}
              {k === 'TRANSFER' && method === 'TRANSFER' && <p className="mt-3 flex gap-2 text-sm text-slate-600"><Banknote className="h-4 w-4 shrink-0 text-brand" />Al confirmar recibirás los datos de la cuenta y tu pedido se liberará al acreditarse el pago.</p>}
            </div>
          ))}
        </div>
      </section>

      <Button size="lg" full loading={pay.isPending} onClick={submit}><Lock className="h-4 w-4" />Confirmar y Pagar · {formatMoney(total)}</Button>
      <p className="flex items-center justify-center gap-1 text-center text-xs text-slate-500"><CheckCircle2 className="h-3.5 w-3.5" />Pago seguro con confirmación instantánea</p>
    </div>
  );
}
