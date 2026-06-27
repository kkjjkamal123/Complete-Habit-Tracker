// Streak maths for habits. Works off an array of YYYY-MM-DD strings.
import { dayKey } from './date';

function addDays(key: string, delta: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d + delta);
  return dayKey(dt);
}

/** Current consecutive-day streak ending today (or yesterday). */
export function currentStreak(done: string[]): number {
  if (done.length === 0) return 0;
  const set = new Set(done);
  const today = dayKey();
  const yesterday = addDays(today, -1);

  // Streak only "alive" if done today or yesterday.
  let cursor = set.has(today) ? today : set.has(yesterday) ? yesterday : null;
  if (cursor === null) return 0;

  let count = 0;
  while (set.has(cursor)) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
}

/** Longest streak ever recorded. */
export function longestStreak(done: string[]): number {
  if (done.length === 0) return 0;
  const sorted = [...new Set(done)].sort();
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (addDays(sorted[i - 1], 1) === sorted[i]) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  return best;
}

export function isDoneToday(done: string[]): boolean {
  return done.includes(dayKey());
}
