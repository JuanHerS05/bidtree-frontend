import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { alertsApi } from '@/api/services';
import { formatMoney } from '@/lib/format';
import type { Auction } from '@/lib/types';
import { toast } from '@/store/toast.store';
import { Button, Input, Modal } from './ui';

/** Configurar_Precio_Limite: avisa cuando la subasta alcance un umbral. */
export function AlertModal({ auction, onClose }: { auction: Auction | null; onClose: () => void }) {
  const [value, setValue] = useState('');
  const m = useMutation({
    mutationFn: (v: number) => alertsApi.setPriceLimit(auction!.id, v),
    onSuccess: (_d, v) => { toast.success('Alerta configurada', `Te avisaremos al llegar a ${formatMoney(v)}.`); setValue(''); onClose(); },
    onError: (e: Error) => toast.error('No se pudo guardar la alerta', e.message),
  });
  const n = Number(value);
  const error = value && (!Number.isFinite(n) || (auction && n <= auction.currentBid)) ? 'Debe ser mayor al precio actual.' : undefined;
  return (
    <Modal open={!!auction} onClose={onClose} title="Alerta de precio límite">
      {auction && (
        <form onSubmit={(e) => { e.preventDefault(); if (!error && n > 0) m.mutate(n); }} className="space-y-4">
          <p className="text-sm text-slate-600"><strong>{auction.title}</strong><br />Precio actual: <span className="num font-semibold text-brand">{formatMoney(auction.currentBid)}</span></p>
          <Input label="Avisarme cuando alcance (COP)" type="number" min={auction.currentBid + 1} value={value} onChange={(e) => setValue(e.target.value)} error={error} autoFocus />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" loading={m.isPending} disabled={!value || !!error}>Guardar alerta</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
