import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
      <p className="num text-7xl font-bold text-brand">404</p>
      <p className="text-slate-600">Esta página no existe o la subasta ya cerró.</p>
      <Link to="/auctions"><Button>Ir al catálogo</Button></Link>
    </div>
  );
}
