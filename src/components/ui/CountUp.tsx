import { animate } from 'framer-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useMotion } from '../../lib/motion';

/** Animated number that counts up to `value`. Respects the count-ups setting. */
export default function CountUp({
  value,
  render,
  duration = 0.9,
}: {
  value: number;
  render?: (n: number) => ReactNode;
  duration?: number;
}) {
  const { prefs } = useMotion();
  const [n, setN] = useState(prefs.counters ? 0 : value);
  const prev = useRef(prefs.counters ? 0 : value);

  useEffect(() => {
    if (!prefs.counters) {
      setN(value);
      prev.current = value;
      return;
    }
    const controls = animate(prev.current, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setN(v),
      onComplete: () => {
        prev.current = value;
      },
    });
    return () => controls.stop();
  }, [value, prefs.counters, duration]);

  return <>{render ? render(n) : Math.round(n)}</>;
}
