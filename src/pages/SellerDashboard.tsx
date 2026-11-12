import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ban, ExternalLink, ImagePlus, Plus } from 'lucide-react';
import clsx from 'clsx';
import { auctionsApi } from '@/api/services';
import { Badge, Button, EmptyState, Input, Modal, Select, Skeleton } from '@/components/ui';
import { APP } from '@/config/app.config';
import { useCountdown } from '@/hooks/useCountdown';
import { useCategories, useMyAuctions } from '@/hooks/queries';
import { formatMoney, formatRemaining } from '@/lib/format';
import type { Auction } from '@/lib/types';
import { toast } from '@/store/toast.store';

const TimeLeft = ({ endsAt }: { endsAt: string }) => {
  const ms = useCountdown(endsAt);
  return <span className={clsx('num', ms > 0 && ms < 300_000 && 'font-semibold text-warn')}>{ms > 0 ? formatRemaining(ms) : '—'}</span>;
};

const statusBadge = (a: Auction) =>
  a.status === 'ACTIVE' ? <Badge tone="live">Activa</Badge>
  : a.status === 'CANCELLED' ? <Badge tone="danger">Cancelada</Badge>
  : a.status === 'SOLD' ? <Badge tone="new">Vendida</Badge>
  : <Badge>Finalizada</Badge>;

const toLocalInput = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

export default function SellerDashboard() {
  const qc = useQueryClient();
  const { data, isLoading } = useMyAuctions();
  const [tab, setTab] = useState<'active' | 'done'>('active');
  const [creating, setCreating] = useState(false);
  const [toCancel, setToCancel] = useState<Auction | null>(null);

  const active = (data ?? []).filter((a) => a.status === 'ACTIVE');
  const done = (data ?? []).filter((a) => a.status !== 'ACTIVE');
  const rows = tab === 'active' ? active : done;
  const revenue = done.filter((a) => a.status === 'ENDED' || a.status === 'SOLD').reduce((s, a) => s + (a.bidCount ? a.currentBid : 0), 0);

  const cancel = useMutation({
    mutationFn: (id: string) => auctionsApi.cancel(id),
    onSuccess: () => { toast.success('Subasta cancelada'); setToCancel(null); qc.invalidateQueries({ queryKey: ['auctions'] }); },
    onError: (e: Error) => toast.error('No se pudo cancelar', e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-h1 text-slate-900">Panel del Vendedor</h1><p className="text-sm text-slate-500">Gestiona tus subastas y sigue las pujas.</p></div>
        <Button variant="accent" onClick={() => setCreating(true)}><Plus className="h-4 w-4" />Crear subasta</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[['Subastas activas', String(active.length)], ['Pujas recibidas', String((data ?? []).reduce((s, a) => s + a.bidCount, 0))], ['Ventas cerradas', formatMoney(revenue)]].map(([k, v]) => (
          <div key={k} className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs uppercase tracking-wide text-slate-500">{k}</p><p className="num mt-1 text-2xl font-bold text-brand">{v}</p></div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex gap-1 border-b px-3 pt-3" role="tablist">
          {([['active', `Activas (${active.length})`], ['done', `Finalizadas (${done.length})`]] as const).map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
              className={clsx('rounded-t-lg px-4 py-2 text-sm font-semibold', tab === k ? 'border-b-2 border-brand text-brand' : 'text-slate-500 hover:text-slate-800')}>{l}</button>
          ))}
        </div>
        {isLoading ? <div className="space-y-2 p-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14" />)}</div>
          : rows.length === 0 ? <div className="p-6"><EmptyState title={tab === 'active' ? 'No tienes subastas activas' : 'Aún no hay subastas finalizadas'}>{tab === 'active' && 'Crea tu primera subasta para empezar a recibir pujas.'}</EmptyState></div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[56rem] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-500">
                  <tr><th className="px-4 py-3">Producto</th><th className="px-4 py-3">Precio inicial</th><th className="px-4 py-3">Puja más alta</th><th className="px-4 py-3">Ganador actual</th><th className="px-4 py-3">Tiempo restante</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3 text-right">Acciones</th></tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((a) => {
                    const canCancel = a.status === 'ACTIVE' && a.bidCount === 0;
                    return (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3"><div className="flex items-center gap-3"><img src={a.imageUrl} alt="" className="h-12 w-12 rounded-lg object-cover" /><div><p className="font-medium text-slate-900">{a.title}</p><p className="text-xs text-slate-500">{a.category} · {a.bidCount} pujas</p></div></div></td>
                        <td className="num px-4 py-3">{formatMoney(a.basePrice)}</td>
                        <td className="num px-4 py-3 font-semibold text-brand">{a.bidCount ? formatMoney(a.currentBid) : '—'}</td>
                        <td className="px-4 py-3">{a.winner ? a.winner.name : <span className="text-slate-400">Sin pujas</span>}</td>
                        <td className="px-4 py-3">{a.status === 'ACTIVE' ? <TimeLeft endsAt={a.endsAt} /> : '—'}</td>
                        <td className="px-4 py-3">{statusBadge(a)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            {a.status === 'ACTIVE' && <Link to={`/auctions/${a.id}/live`}><Button size="sm" variant="outline"><ExternalLink className="h-3.5 w-3.5" />Ver sala</Button></Link>}
                            {a.status === 'ACTIVE' && (
                              <Button size="sm" variant="danger" disabled={!canCancel} onClick={() => setToCancel(a)}
                                title={canCancel ? 'Cancelar subasta' : 'No se puede cancelar: ya existen pujas registradas'}><Ban className="h-3.5 w-3.5" />Cancelar</Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
      </div>

      <CreateModal open={creating} onClose={() => setCreating(false)} />
      <Modal open={!!toCancel} onClose={() => setToCancel(null)} title="¿Cancelar esta subasta?">
        <p className="text-sm text-slate-600">Se cancelará <strong>{toCancel?.title}</strong>. Esta acción no se puede deshacer.</p>
        <div className="mt-5 flex justify-end gap-2"><Button variant="ghost" onClick={() => setToCancel(null)}>Volver</Button><Button variant="danger" loading={cancel.isPending} onClick={() => toCancel && cancel.mutate(toCancel.id)}>Cancelar subasta</Button></div>
      </Modal>
    </div>
  );
}

function CreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: remoteCats } = useCategories();
  const categories = Array.from(new Set([...(remoteCats ?? []), ...APP.fallbackCategories]));
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [f, setF] = useState({ title: '', description: '', category: categories[0] ?? '', price: '', endsAt: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reset = () => { setFile(null); setPreview(''); setF({ title: '', description: '', category: categories[0] ?? '', price: '', endsAt: '' }); setErrors({}); };

  const create = useMutation({
    mutationFn: async () => {
      const { image_url } = await auctionsApi.uploadImage(file!);
      return auctionsApi.create({ title: f.title.trim(), description: f.description.trim(), image_url, base_price: Number(f.price), category: f.category, ends_at: new Date(f.endsAt).toISOString() });
    },
    onSuccess: () => { toast.success('Subasta publicada'); qc.invalidateQueries({ queryKey: ['auctions'] }); reset(); onClose(); },
    onError: (e: Error) => toast.error('No se pudo crear la subasta', e.message),
  });

  const pick = (fl?: File) => {
    if (!fl) return;
    if (!fl.type.startsWith('image/')) return setErrors((e) => ({ ...e, image: 'Selecciona una imagen' }));
    if (fl.size > 5 * 1024 * 1024) return setErrors((e) => ({ ...e, image: 'Máximo 5 MB' }));
    setFile(fl); setPreview(URL.createObjectURL(fl)); setErrors((e) => ({ ...e, image: '' }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.title.trim().length < 3) er.title = 'Ingresa un título';
    if (!file) er.image = 'Sube una imagen del producto';
    if (!(Number(f.price) > 0)) er.price = 'Precio base inválido';
    if (!f.endsAt || new Date(f.endsAt).getTime() < Date.now() + 60_000) er.endsAt = 'Elige una fecha futura';
    setErrors(er);
    if (!Object.keys(er).length) create.mutate();
  };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Crear subasta" wide>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <div className="sm:col-span-2">
          <p className="mb-1 text-sm font-medium text-slate-700">Imagen del producto</p>
          <div onClick={() => fileRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files[0]); }}
            className={clsx('flex h-40 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed bg-slate-50 hover:border-mint', errors.image ? 'border-danger' : 'border-slate-300')} role="button" tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileRef.current?.click()}>
            {preview ? <img src={preview} alt="Vista previa" className="h-full w-full object-contain" /> : <div className="flex flex-col items-center text-sm text-slate-500"><ImagePlus className="mb-1 h-7 w-7" />Arrastra o haz clic para subir</div>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
          {errors.image && <p className="mt-1 text-xs text-danger">{errors.image}</p>}
        </div>
        <div className="sm:col-span-2"><Input label="Título" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} error={errors.title} /></div>
        <div className="sm:col-span-2">
          <label htmlFor="desc" className="mb-1 block text-sm font-medium text-slate-700">Descripción</label>
          <textarea id="desc" rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-mint/60" />
        </div>
        <Input label="Precio base (COP)" type="number" min={1} value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} error={errors.price} />
        <Select label="Categoría" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{categories.map((c) => <option key={c}>{c}</option>)}</Select>
        <div className="sm:col-span-2"><Input label="Fecha y hora de expiración" type="datetime-local" min={toLocalInput(new Date(Date.now() + 120_000))} value={f.endsAt} onChange={(e) => setF({ ...f, endsAt: e.target.value })} error={errors.endsAt} /></div>
        <div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="ghost" onClick={() => { reset(); onClose(); }}>Cancelar</Button><Button type="submit" variant="accent" loading={create.isPending}>Publicar subasta</Button></div>
      </form>
    </Modal>
  );
}
