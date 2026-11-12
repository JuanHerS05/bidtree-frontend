import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { APP } from '@/config/app.config';
import { useCountdown } from '@/hooks/useCountdown';
import { formatMoney, formatRemaining } from '@/lib/format';
import type { Auction } from '@/lib/types';
import { Badge, Button } from './ui';

export function AuctionCard({ auction, onAlert }: { auction: Auction; onAlert?: (a: Auction) => void }) {
  const ms = useCountdown(auction.endsAt);
  const closing = ms > 0 && ms <= APP.endingSoonMinutes * 60_000;
  const isNew = Date.now() - new Date(auction.createdAt).getTime() < 86_400_000;
  return (
    <motion.article layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -3 }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img src={auction.imageUrl} alt={auction.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {auction.status === 'ACTIVE' && ms > 0 && <Badge tone="live">● En vivo</Badge>}
          {closing && <Badge tone="soon">Próxima a cerrar</Badge>}
          {isNew && <Badge tone="new">Nuevo</Badge>}
        </div>
        {onAlert && (
          <button onClick={() => onAlert(auction)} aria-label="Configurar alerta de precio" title="Alerta de precio límite"
            className="absolute right-2 top-2 rounded-full bg-white/90 p-2 text-slate-700 shadow hover:bg-white hover:text-auction">
            <Bell className="h-4 w-4" />
          </button>
        )}
        <span className="num absolute bottom-2 right-2 rounded-md bg-night/80 px-2 py-0.5 text-xs font-semibold text-white">{formatRemaining(ms)}</span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{auction.category}</p>
          <h3 className="line-clamp-2 text-h3 text-slate-900">{auction.title}</h3>
        </div>
        <dl className="mt-auto grid grid-cols-2 gap-2 text-sm">
          <div><dt className="text-xs text-slate-500">Precio base</dt><dd className="num font-medium text-slate-700">{formatMoney(auction.basePrice)}</dd></div>
          <div><dt className="text-xs text-slate-500">Oferta actual</dt><dd className="num text-lg font-bold text-brand">{formatMoney(auction.currentBid)}</dd></div>
        </dl>
        <Link to={`/auctions/${auction.id}/live`}><Button variant="accent" full>Entrar a la Sala</Button></Link>
      </div>
    </motion.article>
  );
}
