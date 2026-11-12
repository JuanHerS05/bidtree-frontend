import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { openNotificationsChannel } from '@/realtime/notificationsChannel';
import { handleEnvelope } from '@/realtime/topicRouter';
import { useAuthStore } from '@/store/auth.store';

/** Mantiene abierto el canal de eventos de tópicos mientras haya sesión. */
export function useNotificationsChannel() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  useEffect(() => {
    if (!user) return;
    return openNotificationsChannel((env) => handleEnvelope(env, qc, useAuthStore.getState().user));
  }, [user, qc]);
}
