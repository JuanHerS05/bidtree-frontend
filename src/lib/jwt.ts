import type { Role, User } from './types';

/** Decodifica (sin verificar) el payload de un JWT. La verificación es del backend. */
export function decodeJwt(token: string): Record<string, any> | null {
  try {
    const part = token.split('.')[1];
    const json = decodeURIComponent(
      atob(part.replace(/-/g, '+').replace(/_/g, '/'))
        .split('').map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join(''),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** Reconstruye el usuario desde los claims por si el login solo devuelve el token. */
export function userFromToken(token: string): User | null {
  const c = decodeJwt(token);
  if (!c) return null;
  const rawRole = String(c.role ?? c.rol ?? (Array.isArray(c.roles) ? c.roles[0] : '') ?? '').toUpperCase();
  const role: Role = rawRole.includes('SELL') || rawRole.includes('VEND') ? 'SELLER' : 'BUYER';
  return { id: String(c.sub ?? c.id ?? ''), name: String(c.name ?? c.nombre ?? c.sub ?? 'Usuario'), email: String(c.email ?? ''), role };
}

export const isExpired = (token: string) => {
  const c = decodeJwt(token);
  return !!c?.exp && c.exp * 1000 < Date.now();
};
