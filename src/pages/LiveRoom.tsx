import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, Gavel, Trophy, Wifi, WifiOff } from 'lucide-react';
import clsx from 'clsx';
import { AnimateNumber } from '@/components/AnimateNumber';
import { CountdownClock } from '@/components/CountdownClock';
import { Avatar, Badge, Button, EmptyState, Skeleton } from '@/components/ui';
import { APP } from '@/config/app.config';
import { useAuction } from '@/hooks/queries';
import { useAuctionRoom } from '@/hooks/useAuctionRoom';
import { formatMoney, formatTime } from '@/lib/format';
import { useAuthStore } from '@/store/auth.store';
import { useRoomStore } from '@/store/room.store';

/** Sala de Pujas en Vivo (`/auctions/:id/live`) — Modo Oscuro inmersivo. */
export default function LiveRoom() {
  const { id = '' } = useParams();
  const me = useAuthStore((s) => s.user);
  const { data: auction, isLoading, isError } = useAuction(id);
  const { sendBid } = useAuctionRoom(id, auction?.title);
  const room = useRoomStore();
  const [custom, setCustom] = useState('');
  const [img, setImg] = useState(0);

  const hasSnapshot = room.endsAt !== null;
  const current = hasSnapshot ? room.currentBid : auction?.currentBid ?? 0;
  const endsAt = room.endsAt ?? auction?.endsAt ?? null;
  const status = hasSnapshot ? room.status : auction?.status ?? 'ACTIVE';
  const ended = status !== 'ACTIVE';
  const bids = hasSnapshot ? room.bids : [];
  const leader = bids[0];
  const iLead = !!me && leader?.userId === me.id;
  const isSeller = !!me && auction?.seller.id === me.id;
  const minNext = current + APP.minIncrement;
  const amount = custom !== '' ? Number(custom) : minNext;
  const invalid = !Number.isFinite(amount) || amount < minNext;

  // Si cambia el precio (alguien pujó), limpia el valor personalizado ya obsoleto.
  useEffect(() => { setCustom(''); }, [current]);

  if (isLoading) return <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]"><Skeleton className="h-[34rem] bg-slate-800" /><Skeleton className="h-[34rem] bg-slate-800" /></div>;
  if (isError || !auction) return <EmptyState title="Subasta no encontrada"><Link to="/auctions" className="font-semibold text-brand underline">Volver al catálogo</Link></EmptyState>;

  const place = () => { if (!invalid && !ended && !isSeller) sendBid(amount); };
  const r = room.result;
  const iWon = ended && !!me && (r?.winnerId === me.id || (!r && auction.winner?.id === me.id));
  const orderId = r?.orderId ?? auction.orderId ?? null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      {/* ── Panel izquierdo: producto ── */}
      <section className="space-y-4">
        <div className="overflow-hidden rounded-2xl bg-slate-900 ring-1 ring-white/10">
          <AnimatePresence mode="wait">
            <motion.img key={img} src={auction.gallery[img] ?? auction.imageUrl} alt={auction.title} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="aspect-[4/3] w-full object-cover" />
          </AnimatePresence>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {auction.gallery.slice(0, 4).map((g, i) => (
            <button key={i} onClick={() => setImg(i)} aria-label={`Imagen ${i + 1}`} className={clsx('overflow-hidden rounded-xl ring-2 transition', img === i ? 'ring-auction' : 'ring-transparent opacity-70 hover:opacity-100')}>
              <img src={g} alt="" className="aspect-square w-full object-cover" />
            </button>
          ))}
        </div>
        <div className="rounded-2xl bg-slate-900 p-5 ring-1 ring-white/10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Descripción del producto</p>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <span className="flex items-center gap-1"><Eye className="h-4 w-4" /><span className="num">{room.viewers.toLocaleString(APP.locale)}</span></span>
              {!ended ? <Badge tone="live">● EN VIVO</Badge> : <Badge>Finalizada</Badge>}
            </div>
          </div>
          <h1 className="mt-1 text-h1 text-white">{auction.title}</h1>
          <p className="mt-1 text-sm text-slate-400">{auction.condition && <>Condición: <span className="text-slate-200">{auction.condition}</span> · </>}Vendedor: <span className="text-slate-200">{auction.seller.name}</span></p>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">{auction.description}</p>
          {Object.keys(auction.specs).length > 0 && (
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 border-t border-white/10 pt-4 text-sm">
              {Object.entries(auction.specs).map(([k, v]) => (<div key={k}><dt className="text-xs text-slate-500">{k}</dt><dd className="text-slate-200">{v}</dd></div>))}
            </dl>
          )}
        </div>
      </section>

      {/* ── Panel derecho: Live Stream Deck ── */}
      <section className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-2xl bg-slate-900 p-5 ring-1 ring-white/10">
          <div className="mb-2 flex justify-end text-xs text-slate-400">
            {room.connection === 'open' ? <span className="flex items-center gap-1 text-mint"><Wifi className="h-3.5 w-3.5" />Conectado</span> : <span className="flex items-center gap-1 text-warn"><WifiOff className="h-3.5 w-3.5" />{room.connection === 'connecting' ? 'Conectando…' : 'Reconectando…'}</span>}
          </div>
          <CountdownClock endsAt={endsAt} ended={ended} extendedAt={room.extendedAt} />

          <div className="mt-5 flex items-end justify-between gap-3 border-t border-white/10 pt-4">
            <div>
              <AnimateNumber value={current} className="block text-4xl font-bold text-white" />
              <p className="text-xs text-slate-400">Oferta actual</p>
            </div>
            {leader && <div className="flex items-center gap-2 rounded-full bg-slate-800 py-1 pl-1 pr-3 text-sm"><Avatar name={leader.userName} size={26} /><span className={iLead ? 'font-semibold text-mint' : 'text-slate-200'}>{iLead ? 'Tú lideras' : leader.userName}</span></div>}
          </div>

          {ended ? (
            <div className="mt-5 rounded-xl bg-slate-800 p-4 text-center">
              <Trophy className={clsx('mx-auto h-8 w-8', iWon ? 'text-warn' : 'text-slate-500')} />
              <p className="mt-1 font-semibold text-white">{status === 'CANCELLED' ? 'Subasta cancelada' : iWon ? '¡Ganaste esta subasta!' : r?.winnerName ?? auction.winner?.name ? `Ganó ${r?.winnerName ?? auction.winner?.name}` : 'Cerró sin pujas'}</p>
              <p className="num text-sm text-slate-400">Precio final {formatMoney(r?.finalPrice ?? current)}</p>
              {iWon && orderId && <Link to={`/checkout/${orderId}`}><Button variant="accent" className="mt-3" full>Ir a pagar</Button></Link>}
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {APP.quickBids.map((q) => (
                  <button key={q} disabled={isSeller} onClick={() => setCustom(String(current + q))}
                    className="num rounded-lg bg-slate-800 py-2 text-sm font-semibold text-slate-100 ring-1 ring-white/10 transition hover:bg-slate-700 disabled:opacity-40">+ {formatMoney(q)}</button>
                ))}
              </div>
              <div>
                <label htmlFor="custom" className="mb-1 block text-xs text-slate-400">Oferta personalizada (mín. {formatMoney(minNext)})</label>
                <input id="custom" type="number" inputMode="numeric" value={custom} placeholder={String(minNext)} disabled={isSeller}
                  onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && place()}
                  className={clsx('num w-full rounded-lg border bg-slate-800 px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-mint/60', custom && invalid ? 'border-danger' : 'border-slate-700')} />
              </div>
              <Button variant="accent" size="lg" full disabled={invalid || isSeller || room.connection !== 'open'} onClick={place}><Gavel className="h-5 w-5" />Realizar Puja · {formatMoney(Number.isFinite(amount) ? amount : minNext)}</Button>
              {isSeller && <p className="text-center text-xs text-slate-400">Eres el vendedor: no puedes pujar en tu subasta.</p>}
              {iLead && !isSeller && <p className="text-center text-xs text-mint">Vas ganando. Espera a que alguien te supere.</p>}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-slate-900 p-5 ring-1 ring-white/10">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Historial de pujas en vivo</p>
          {bids.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">Aún no hay pujas. ¡Sé el primero!</p> : (
            <ul className="thin-scroll max-h-72 space-y-2 overflow-y-auto pr-1" aria-live="polite">
              <AnimatePresence initial={false}>
                {bids.map((b, i) => (
                  <motion.li key={b.id} layout initial={{ opacity: 0, x: 24, height: 0 }} animate={{ opacity: 1, x: 0, height: 'auto' }} exit={{ opacity: 0 }}
                    className={clsx('flex items-center gap-3 rounded-xl px-3 py-2', i === 0 ? 'bg-mint/15 ring-1 ring-mint/60' : 'bg-slate-800/60')}>
                    <Avatar name={b.userName} size={32} />
                    <div className="min-w-0 flex-1">
                      {i === 0 && <p className="text-[10px] font-bold uppercase tracking-wider text-mint">Puja más alta</p>}
                      <p className="truncate text-sm text-slate-200">@{b.userName}{me?.id === b.userId && ' (tú)'}</p>
                    </div>
                    <div className="text-right"><p className="num text-sm font-bold text-white">{formatMoney(b.amount)}</p><p className="num text-[11px] text-slate-400">{formatTime(b.at)}</p></div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
