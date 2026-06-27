// Date helpers — all "day keys" are local-time YYYY-MM-DD strings.
import { format } from 'date-fns';

export function dayKey(d: Date = new Date()): string {
  return format(d, 'yyyy-MM-dd');
}

/** The last n day-keys, oldest → newest (includes today). */
export function lastNDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return dayKey(d);
  });
}

export function monthKey(d: Date = new Date()): string {
  return format(d, 'yyyy-MM');
}

export function prettyDate(d: Date = new Date()): string {
  return format(d, 'EEE, MMM d');
}

export function prettyDateLong(d: Date = new Date()): string {
  return format(d, 'EEEE, MMMM d, yyyy');
}

export function prettyMonth(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return format(new Date(y, m - 1, 1), 'MMMM yyyy');
}

export function greeting(d: Date = new Date()): string {
  const h = d.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function clockTime(iso: string): string {
  return format(new Date(iso), 'HH:mm');
}

/** Narrow weekday label (M, T, W…) for a YYYY-MM-DD key. */
export function dayLabel(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return format(new Date(y, m - 1, d), 'EEEEE');
}

/** All day-keys of the given month (1st → last), oldest → newest. */
export function monthDays(d: Date = new Date()): string[] {
  const y = d.getFullYear();
  const m = d.getMonth();
  const n = new Date(y, m + 1, 0).getDate();
  return Array.from({ length: n }, (_, i) => dayKey(new Date(y, m, i + 1)));
}

/** "Jun 5" for a YYYY-MM-DD key. */
export function shortDate(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return format(new Date(y, m - 1, d), 'MMM d');
}

/** "1h 30m" / "45m" */
export function humanMinutes(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
