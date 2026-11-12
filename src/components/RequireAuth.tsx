import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { homeForRole, useAuthStore } from '@/store/auth.store';
import { isExpired } from '@/lib/jwt';
import type { Role } from '@/lib/types';

export function RequireAuth({ role }: { role?: Role }) {
  const { token, user } = useAuthStore();
  const loc = useLocation();
  if (!token || !user || isExpired(token)) return <Navigate to="/login" replace state={{ from: loc.pathname + loc.search }} />;
  if (role && user.role !== role) return <Navigate to={homeForRole(user.role)} replace />;
  return <Outlet />;
}
