// Persistent timer store. Lives outside React so the running stopwatch
// survives tab navigation AND full page reloads — elapsed time is always
// derived from a saved start timestamp, never from component state.
import { useSyncExternalStore } from 'react';

export interface TimerState {
  running: boolean;
  /** epoch ms when started */
  startedAt: number;
  title: string;
  category: string;
}

const KEY = 'dailytrack.timer';
const EMPTY: TimerState = { running: false, startedAt: 0, title: '', category: 'Work' };

function load(): TimerState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...EMPTY, ...(JSON.parse(raw) as Partial<TimerState>) };
  } catch {
    /* ignore */
  }
  return EMPTY;
}

let state = load();
const listeners = new Set<() => void>();

function set(next: TimerState) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export function useTimer(): TimerState {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

export function startTimer() {
  set({ ...state, running: true, startedAt: Date.now() });
}

/** Stops the timer and returns elapsed whole seconds. */
export function stopTimer(): number {
  const secs = state.running ? Math.floor((Date.now() - state.startedAt) / 1000) : 0;
  set({ ...state, running: false, startedAt: 0 });
  return secs;
}

export function setTimerMeta(patch: Partial<Pick<TimerState, 'title' | 'category'>>) {
  set({ ...state, ...patch });
}

export function elapsedSec(s: TimerState): number {
  return s.running ? Math.max(0, Math.floor((Date.now() - s.startedAt) / 1000)) : 0;
}
