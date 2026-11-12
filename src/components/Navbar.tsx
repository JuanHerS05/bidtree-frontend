import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Menu, Search, Sprout, X } from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '@/store/auth.store';
import { Logo } from './Logo';
import { NotificationCenter } from './NotificationCenter';
import { Avatar } from './ui';

export function Navbar() {
  const { user, logout } = useAuthStore();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [menu, setMenu] = useState(false);
  const [mobile, setMobile] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const submit = (e: FormEvent) => { e.preventDefault(); nav(`/auctions${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`); };

  const links = [
    { to: '/auctions', label: 'Catálogo' },
    ...(user?.role === 'SELLER' ? [{ to: '/dashboard/seller', label: 'Mis Subastas' }] : []),
    { to: '/rewards', label: 'Mi Árbol' },
  ];
  const cls = ({ isActive }: { isActive: boolean }) =>
    clsx('rounded-md px-3 py-1.5 text-sm font-medium transition-colors', isActive ? 'bg-white/15 text-white' : 'text-white/80 hover:text-white');

  return (
    <header className="sticky top-0 z-40 bg-brand shadow-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link to="/auctions" aria-label="BidTree — inicio"><Logo light /></Link>
        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {links.map((l) => <NavLink key={l.to} to={l.to} className={cls}>{l.label}</NavLink>)}
        </nav>
        <form onSubmit={submit} className="ml-auto hidden max-w-xs flex-1 items-center rounded-full bg-white/10 px-3 ring-1 ring-white/20 focus-within:bg-white/20 sm:flex" role="search">
          <Search className="h-4 w-4 text-white/70" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar subastas…" aria-label="Buscar subastas"
            className="w-full bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-white/60" />
        </form>
        <div className="ml-auto flex items-center gap-1 sm:ml-0">
          <NotificationCenter />
          <div ref={ref} className="relative">
            <button onClick={() => setMenu((m) => !m)} className="flex items-center gap-2 rounded-full p-1 pr-3 hover:bg-white/10" aria-haspopup="menu" aria-expanded={menu}>
              <Avatar name={user?.name ?? '?'} size={32} />
              <span className="hidden text-sm font-medium text-white lg:block">{user?.name}</span>
            </button>
            {menu && (
              <div role="menu" className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl bg-white py-1 text-sm text-slate-700 shadow-2xl ring-1 ring-black/5">
                <div className="border-b px-4 py-2"><p className="font-semibold">{user?.name}</p><p className="text-xs text-slate-500">{user?.role === 'SELLER' ? 'Vendedor' : 'Comprador'} · {user?.email}</p></div>
                <Link role="menuitem" to="/rewards" onClick={() => setMenu(false)} className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50"><Sprout className="h-4 w-4" />Mi Árbol de Puntos</Link>
                <button role="menuitem" onClick={() => { logout(); nav('/login'); }} className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-slate-50"><LogOut className="h-4 w-4" />Cerrar sesión</button>
              </div>
            )}
          </div>
          <button className="rounded-md p-2 text-white md:hidden" onClick={() => setMobile((m) => !m)} aria-label="Menú">{mobile ? <X /> : <Menu />}</button>
        </div>
      </div>
      {mobile && (
        <div className="space-y-2 border-t border-white/10 px-4 pb-4 pt-2 md:hidden">
          <form onSubmit={submit} className="flex items-center rounded-full bg-white/10 px-3">
            <Search className="h-4 w-4 text-white/70" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" className="w-full bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-white/60" />
          </form>
          {links.map((l) => <NavLink key={l.to} to={l.to} onClick={() => setMobile(false)} className={cls}>{l.label}</NavLink>)}
        </div>
      )}
    </header>
  );
}
