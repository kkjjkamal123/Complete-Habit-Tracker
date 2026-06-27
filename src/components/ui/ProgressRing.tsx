import { motion } from 'framer-motion';
import type { AccentKey } from '../../lib/types';
import type { ReactNode } from 'react';

interface Props {
  /** 0..1 */
  progress: number;
  size?: number;
  thickness?: number;
  color?: AccentKey;
  children?: ReactNode;
  /** seconds for the sweep animation */
  duration?: number;
}

const STOPS: Record<AccentKey, [string, string]> = {
  move: ['#fb7185', '#ec4899'],
  time: ['#38bdf8', '#6366f1'],
  habit: ['#fb923c', '#f43f5e'],
  goal: ['#34d399', '#14b8a6'],
  review: ['#a78bfa', '#818cf8'],
  accent: ['#6366f1', '#ec4899'],
};

/** Animated Activity-rings style progress ring. */
export default function ProgressRing({
  progress,
  size = 120,
  thickness = 12,
  color = 'accent',
  children,
  duration = 1,
}: Props) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, progress));
  const gradId = `ring-${color}`;
  const [from, to] = STOPS[color];

  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={thickness}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - c * pct }}
          transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {children && <div className="ring-center">{children}</div>}
    </div>
  );
}
