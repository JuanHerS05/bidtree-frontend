import { useEffect, useState } from 'react';

/** Milisegundos restantes hasta `endsAt`, refrescado ~5 veces por segundo. */
export function useCountdown(endsAt?: string | null): number {
  const target = endsAt ? new Date(endsAt).getTime() : 0;
  const [remaining, setRemaining] = useState(() => Math.max(0, target - Date.now()));
  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, target - Date.now()));
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [target]);
  return endsAt ? remaining : 0;
}
