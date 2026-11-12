/**
 * Canal de notificaciones (ms-pagos-alertas). Recibe sobres `{ topic, payload }`
 * emitidos por el backend cuando consume tópicos de Kafka.
 */
import { env } from '@/config/env';
import { ENDPOINTS } from '@/config/endpoints';
import { serviceWsUrl } from '@/config/services';
import { useAuthStore } from '@/store/auth.store';
import { mockBus } from '@/api/mock/engine';
import { ReconnectingSocket } from './ReconnectingSocket';

export interface TopicEnvelope { topic: string; payload: Record<string, any> }

export function openNotificationsChannel(onEnvelope: (e: TopicEnvelope) => void): () => void {
  if (env.USE_MOCKS) {
    return mockBus.subscribe((e) => { if (e.kind === 'topic') onEnvelope({ topic: e.topic, payload: e.payload }); });
  }
  const sock = new ReconnectingSocket(
    () => {
      const base = serviceWsUrl(ENDPOINTS.ws.notifications.service, ENDPOINTS.ws.notifications.path);
      const token = useAuthStore.getState().token;
      return token ? `${base}?token=${encodeURIComponent(token)}` : base;
    },
    {
      onMessage: (raw: any) => {
        const topic = raw?.topic ?? raw?.type;
        if (topic) onEnvelope({ topic: String(topic), payload: raw.payload ?? raw.data ?? raw });
      },
      onStatus: () => {},
    },
  );
  sock.connect();
  return () => sock.close();
}
