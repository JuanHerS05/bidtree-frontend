import { Outlet, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { useNotificationsChannel } from '@/hooks/useNotificationsChannel';
import { DevPanel } from './DevPanel';
import { Navbar } from './Navbar';
import { ToastHost } from './ToastHost';

/** Marco de las pantallas autenticadas. La Sala Live usa el Modo Oscuro (#0F172A). */
export function Layout() {
  useNotificationsChannel();
  const dark = /^\/auctions\/[^/]+\/live$/.test(useLocation().pathname);
  return (
    <div className={clsx('min-h-screen', dark ? 'bg-night text-slate-100' : 'bg-paper')}>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6"><Outlet /></main>
      <ToastHost />
      <DevPanel />
    </div>
  );
}
