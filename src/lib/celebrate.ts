import confetti from 'canvas-confetti';
import { haptic } from './haptics';

/** Celebratory confetti burst + success haptic. Respects reduced-motion
 *  and the user's "Celebrations" animation setting. */
export function celebrate() {
  haptic('success');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  try {
    const p = JSON.parse(localStorage.getItem('dailytrack.anim') || '{}');
    if (p.confetti === false) return;
  } catch {
    /* ignore */
  }
  confetti({
    particleCount: 90,
    spread: 72,
    startVelocity: 38,
    origin: { y: 0.7 },
    colors: ['#6366f1', '#a855f7', '#ec4899', '#34d399', '#fb923c'],
    disableForReducedMotion: true,
  });
}
