/**
 * Lectura centralizada de variables de entorno (VITE_*).
 * Nada más en el proyecto debería leer import.meta.env directamente.
 */
const raw = import.meta.env as unknown as Record<string, string | undefined>;

export const getEnv = (key: string): string | undefined => {
  const v = raw[key];
  return v === undefined || v === '' ? undefined : v;
};

export const env = {
  /** true = datos simulados en memoria; false = backend real. */
  USE_MOCKS: (getEnv('VITE_USE_MOCKS') ?? 'true') !== 'false',
  GATEWAY_URL: (getEnv('VITE_GATEWAY_URL') ?? 'http://localhost:8080').replace(/\/$/, ''),
};
