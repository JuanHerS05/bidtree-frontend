import { useState } from 'react';
import { FlaskConical } from 'lucide-react';
import { env } from '@/config/env';
import { TOPICS } from '@/config/topics';
import { db } from '@/api/mock/db';
import { publishTopic } from '@/api/mock/engine';

/** Solo en modo mock: dispara eventos de tópicos para probar notificaciones sin backend. */
export function DevPanel() {
  const [open, setOpen] = useState(false);
  if (!env.USE_MOCKS) return null;
  const me = db.me;
  const a = db.auctions.find((x) => x.status === 'ACTIVE') ?? db.auctions[0];
  const fire = (topic: string, payload: Record<string, unknown>) => { if (me) publishTopic(topic, { userId: me.id, ...payload }); };
  const items: [string, () => void][] = [
    [`${TOPICS.outbid}`, () => fire(TOPICS.outbid, { auctionId: a.id, title: a.title, amount: a.currentBid + 20000, by: 'RareItemFan' })],
    [`${TOPICS.priceLimitReached}`, () => fire(TOPICS.priceLimitReached, { auctionId: a.id, title: a.title, threshold: a.currentBid, amount: a.currentBid })],
    [`${TOPICS.auctionEnded} (ganas)`, () => fire(TOPICS.auctionEnded, { auctionId: a.id, title: a.title, winnerId: me?.id, amount: 800000, orderId: 'ord-demo' })],
    [`${TOPICS.paymentReassignment}`, () => fire(TOPICS.paymentReassignment, { orderId: 'ord-reasign-1', title: db.auctions[1].title, price: db.auctions[1].currentBid })],
    [`${TOPICS.paymentRegistered}`, () => fire(TOPICS.paymentRegistered, { orderId: 'ord-demo', points: 120 })],
  ];
  return (
    <div className="fixed bottom-4 left-4 z-[60] text-xs">
      {open && (
        <div className="mb-2 w-64 rounded-xl bg-night p-3 text-slate-200 shadow-2xl ring-1 ring-white/10">
          <p className="mb-2 font-semibold text-white">Simular evento de tópico</p>
          <div className="space-y-1">
            {items.map(([label, fn]) => (
              <button key={label} onClick={fn} className="block w-full truncate rounded-md bg-white/5 px-2 py-1.5 text-left hover:bg-white/15">{label}</button>
            ))}
          </div>
        </div>
      )}
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1.5 rounded-full bg-night px-3 py-2 font-medium text-white shadow-lg ring-1 ring-white/20" title="Panel de demostración (modo mock)">
        <FlaskConical className="h-4 w-4" /> Demo
      </button>
    </div>
  );
}
