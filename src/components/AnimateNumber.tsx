import { useEffect, useRef, useState } from 'react';
import { animate, useMotionValue } from 'framer-motion';
import clsx from 'clsx';
import { formatMoney } from '@/lib/format';

/** Conteo numérico animado (spec: `AnimateNumber`). */
export function AnimateNumber({ value, format = formatMoney, className, duration = 0.6 }:
  { value: number; format?: (n: number) => string; className?: string; duration?: number }) {
  const mv = useMotionValue(value);
  const fmt = useRef(format);
  fmt.current = format;
  const [text, setText] = useState(() => format(value));
  useEffect(() => {
    const unsub = mv.on('change', (v) => setText(fmt.current(Math.round(v))));
    const controls = animate(mv, value, { duration, ease: 'easeOut' });
    return () => { controls.stop(); unsub(); };
  }, [value, duration, mv]);
  return <span className={clsx('num', className)}>{text}</span>;
}
