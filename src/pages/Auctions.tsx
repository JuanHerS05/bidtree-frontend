import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PackageSearch, SlidersHorizontal } from 'lucide-react';
import clsx from 'clsx';
import { AlertModal } from '@/components/AlertModal';
import { AuctionCard } from '@/components/AuctionCard';
import { Button, EmptyState, Input, Select, Skeleton } from '@/components/ui';
import { APP } from '@/config/app.config';
import { useAuctions, useCategories } from '@/hooks/queries';
import type { Auction, AuctionFilters } from '@/lib/types';

/** Catálogo del Comprador (`/auctions`). Los filtros viven en la URL: ?q&category&min_price&max_price&ends_within_hours */
export default function Auctions() {
  const [sp, setSp] = useSearchParams();
  const [alertFor, setAlertFor] = useState<Auction | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [min, setMin] = useState(sp.get('min_price') ?? '');
  const [max, setMax] = useState(sp.get('max_price') ?? '');

  const filters: AuctionFilters = {
    q: sp.get('q') || undefined,
    category: sp.get('category') || undefined,
    min_price: sp.get('min_price') ? Number(sp.get('min_price')) : undefined,
    max_price: sp.get('max_price') ? Number(sp.get('max_price')) : undefined,
    ends_within_hours: sp.get('ends_within_hours') ? Number(sp.get('ends_within_hours')) : undefined,
  };
  const { data, isLoading, isError, error } = useAuctions(filters);
  const { data: remoteCats } = useCategories();
  const categories = remoteCats?.length ? remoteCats : [...APP.fallbackCategories];

  const update = (patch: Record<string, string | undefined>) => {
    const n = new URLSearchParams(sp);
    Object.entries(patch).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k)));
    setSp(n, { replace: true });
  };
  const clear = () => { setMin(''); setMax(''); setSp({}, { replace: true }); };
  const hasFilters = [...sp.keys()].length > 0;

  const panel = (
    <aside className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5">
      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-900">Categorías</h2>
        <ul className="space-y-1">
          <li><button onClick={() => update({ category: undefined })} className={clsx('w-full rounded-md px-2 py-1.5 text-left text-sm', !filters.category ? 'bg-brand-50 font-semibold text-brand' : 'text-slate-600 hover:bg-slate-50')}>Todas</button></li>
          {categories.map((c) => (
            <li key={c}><button onClick={() => update({ category: c })} className={clsx('w-full rounded-md px-2 py-1.5 text-left text-sm', filters.category === c ? 'bg-brand-50 font-semibold text-brand' : 'text-slate-600 hover:bg-slate-50')}>{c}</button></li>
          ))}
        </ul>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); update({ min_price: min || undefined, max_price: max || undefined }); }} className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-900">Precio actual (COP)</h2>
        <div className="grid grid-cols-2 gap-2">
          <Input type="number" min={0} placeholder="Mínimo" aria-label="Precio mínimo" value={min} onChange={(e) => setMin(e.target.value)} />
          <Input type="number" min={0} placeholder="Máximo" aria-label="Precio máximo" value={max} onChange={(e) => setMax(e.target.value)} />
        </div>
        <Button type="submit" variant="outline" size="sm" full>Aplicar rango</Button>
      </form>
      <Select label="Termina en" value={sp.get('ends_within_hours') ?? ''} onChange={(e) => update({ ends_within_hours: e.target.value || undefined })}>
        {APP.endsWithinOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </Select>
      {hasFilters && <Button variant="ghost" size="sm" full onClick={clear}>Limpiar filtros</Button>}
    </aside>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-h1 text-slate-900">Subastas activas</h1>
          <p className="text-sm text-slate-500">{filters.q ? <>Resultados para “<strong>{filters.q}</strong>” · </> : null}{data ? `${data.length} subastas` : 'Cargando…'}</p>
        </div>
        <Button variant="outline" className="lg:hidden" onClick={() => setShowFilters((s) => !s)}><SlidersHorizontal className="h-4 w-4" />Filtros</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <div className={clsx(!showFilters && 'hidden lg:block')}>{panel}</div>
        <section aria-live="polite">
          {isLoading && <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-80" />)}</div>}
          {isError && <EmptyState title="No pudimos cargar el catálogo">{(error as Error).message}</EmptyState>}
          {data && data.length === 0 && <EmptyState icon={<PackageSearch className="h-10 w-10" />} title="Sin resultados">Prueba con otros filtros o una búsqueda distinta.</EmptyState>}
          {data && data.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {data.map((a) => <AuctionCard key={a.id} auction={a} onAlert={setAlertFor} />)}
            </div>
          )}
        </section>
      </div>
      <AlertModal auction={alertFor} onClose={() => setAlertFor(null)} />
    </div>
  );
}
