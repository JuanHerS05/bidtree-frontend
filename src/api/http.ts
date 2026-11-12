import { env } from '@/config/env';
import { buildPath, type Endpoint } from '@/config/endpoints';
import { serviceUrl } from '@/config/services';
import { useAuthStore } from '@/store/auth.store';
import { mockRequest } from './mock/router';

export class ApiError extends Error {
  status: number;
  data?: unknown;
  constructor(message: string, status: number, data?: unknown) { super(message); this.status = status; this.data = data; }
}

export interface CallOptions {
  params?: Record<string, string | number>;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  signal?: AbortSignal;
}

/**
 * ÚNICO punto de salida HTTP. Recibe un Endpoint (de config/endpoints.ts), resuelve la URL del
 * microservicio (config/services.ts), agrega el JWT y normaliza errores.
 */
export async function call<T>(ep: Endpoint, opts: CallOptions = {}): Promise<T> {
  try {
    if (env.USE_MOCKS) return await mockRequest<T>(ep, opts);
    return await realRequest<T>(ep, opts);
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status === 401 && useAuthStore.getState().token) useAuthStore.getState().logout();
    if (err instanceof ApiError) throw err;
    throw new ApiError((err as Error).message || 'Error de red', status ?? 0);
  }
}

async function realRequest<T>(ep: Endpoint, opts: CallOptions): Promise<T> {
  let url = serviceUrl(ep.service, buildPath(ep.path, opts.params));
  const qs = new URLSearchParams();
  Object.entries(opts.query ?? {}).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qs.set(k, String(v)); });
  if ([...qs].length) url += `?${qs}`;

  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = useAuthStore.getState().token;
  if (token) headers.Authorization = `Bearer ${token}`;
  let body: BodyInit | undefined;
  if (opts.body instanceof FormData) body = opts.body;
  else if (opts.body !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(opts.body); }

  const res = await fetch(url, { method: ep.method, headers, body, signal: opts.signal });
  const text = await res.text();
  const data = text ? safeJson(text) : undefined;
  if (!res.ok) {
    const msg = (data as any)?.message ?? (data as any)?.detail ?? (data as any)?.error ?? `Error ${res.status}`;
    throw new ApiError(typeof msg === 'string' ? msg : JSON.stringify(msg), res.status, data);
  }
  return data as T;
}

const safeJson = (t: string) => { try { return JSON.parse(t); } catch { return t; } };
