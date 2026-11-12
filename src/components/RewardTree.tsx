import { motion } from 'framer-motion';

/** Reward Tree Meter: el follaje se va "llenando" de hojas verdes según el progreso (0–1). */
const LEAVES: [number, number][] = [
  [150, 70], [110, 90], [190, 90], [80, 120], [220, 120], [130, 120], [170, 120],
  [100, 155], [200, 155], [150, 105], [65, 150], [235, 150], [150, 145], [125, 60], [175, 60],
];

export function RewardTree({ progress }: { progress: number }) {
  const filled = Math.round(Math.min(1, Math.max(0, progress)) * LEAVES.length);
  return (
    <svg viewBox="0 0 300 260" className="mx-auto h-64 w-full max-w-sm" role="img" aria-label={`Árbol de puntos al ${Math.round(progress * 100)}%`}>
      <ellipse cx="150" cy="238" rx="90" ry="10" fill="#0F5A47" opacity=".12" />
      <path d="M142 235 C144 200 146 180 148 150 L152 150 C154 180 156 200 158 235 Z" fill="#7C4A2D" />
      <path d="M150 190 C130 180 120 170 108 160 M150 175 C170 165 182 155 196 146" stroke="#7C4A2D" strokeWidth="5" strokeLinecap="round" fill="none" />
      {LEAVES.map(([x, y], i) => {
        const on = i < filled;
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${(i % 5) * 24 - 48})`}>
            <motion.path
              d="M0 0 C-14 -6 -14 -26 0 -34 C14 -26 14 -6 0 0 Z"
              initial={false}
              animate={{ fill: on ? '#10B981' : '#CBD5E1', scale: on ? 1 : 0.8, opacity: on ? 1 : 0.7 }}
              transition={{ delay: on ? i * 0.06 : 0, type: 'spring', stiffness: 220, damping: 14 }}
              style={{ transformOrigin: '0px 0px' }}
            />
          </g>
        );
      })}
    </svg>
  );
}
