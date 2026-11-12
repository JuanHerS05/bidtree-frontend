/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  CONEXIÓN CON LOS MICROSERVICIOS                              ║
 * ╚══════════════════════════════════════════════════════════════╝
 * Para cambiar a dónde apunta cada microservicio NO hace falta tocar código:
 * edita el archivo `.env` (ver `.env.example`). Si prefieres hacerlo aquí,
 * cambia `envName`, `eurekaId` o `defaultPrefix` de cada servicio.
 *
 * Resolución de la URL de un servicio:
 *   1. VITE_URL_<SERVICIO>     → URL directa a ese microservicio
 *   2. VITE_GATEWAY_URL        → gateway común (Spring Cloud Gateway / Eureka)
 *   + VITE_PREFIX_<SERVICIO>   → prefijo de ruta (p. ej. /ms-pujas) si el gateway enruta por id de servicio
 */
import { env, getEnv } from './env';

export type ServiceKey = 'usuarios' | 'subastas' | 'pujas' | 'pagosAlertas';

export interface ServiceConfig {
  key: ServiceKey;
  label: string;
  /** Id con el que el servicio se registra en Eureka (informativo / para prefijos). */
  eurekaId: string;
  baseUrl: string;
  pathPrefix: string;
  wsBaseUrl: string;
}

const toWs = (url: string) => url.replace(/^http/i, 'ws');

function define(key: ServiceKey, label: string, eurekaId: string, envName: string, defaultPrefix = ''): ServiceConfig {
  const baseUrl = (getEnv(`VITE_URL_${envName}`) ?? env.GATEWAY_URL).replace(/\/$/, '');
  return {
    key,
    label,
    eurekaId,
    baseUrl,
    pathPrefix: getEnv(`VITE_PREFIX_${envName}`) ?? defaultPrefix,
    wsBaseUrl: (getEnv(`VITE_WS_${envName}`) ?? toWs(baseUrl)).replace(/\/$/, ''),
  };
}

export const SERVICES: Record<ServiceKey, ServiceConfig> = {
  usuarios: define('usuarios', 'Usuarios (Java / Spring Boot)', 'ms-usuarios', 'USUARIOS'),
  subastas: define('subastas', 'Subastas y Recompensas (FastAPI)', 'ms-subastas', 'SUBASTAS'),
  pujas: define('pujas', 'Pujas en vivo (Go / Redis)', 'ms-pujas', 'PUJAS'),
  pagosAlertas: define('pagosAlertas', 'Pagos y Alertas (Python / MongoDB)', 'ms-pagos-alertas', 'PAGOS_ALERTAS'),
};

export const serviceUrl = (key: ServiceKey, path: string) =>
  `${SERVICES[key].baseUrl}${SERVICES[key].pathPrefix}${path}`;

export const serviceWsUrl = (key: ServiceKey, path: string) =>
  `${SERVICES[key].wsBaseUrl}${SERVICES[key].pathPrefix}${path}`;
