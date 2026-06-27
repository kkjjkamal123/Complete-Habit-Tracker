// ============================================================
// Local-first reactive store.
// Persists to localStorage, works fully offline with zero config.
// (Firebase sync layers on top of this later — see firebase.ts)
// ============================================================
import { useSyncExternalStore } from 'react';
import type { DB } from './types';

const KEY = 'dailytrack.db.v1';

const EMPTY: DB = {
  activities: [],
  todos: [],
  habits: [],
  goals: [],
  reviews: [],
};

/** A few starter habits so the app feels alive on first run. */
function seed(): DB {
  const now = new Date().toISOString();
  return {
    ...EMPTY,
    habits: [
      // Stable ids so the starter habits dedupe (not duplicate) when synced.
      { id: 'seed-move', name: 'Move', emoji: '🏃', color: 'move', createdAt: now, done: [] },
      { id: 'seed-read', name: 'Read', emoji: '📚', color: 'goal', createdAt: now, done: [] },
      { id: 'seed-meditate', name: 'Meditate', emoji: '🧘', color: 'review', createdAt: now, done: [] },
    ],
  };
}

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return seed();
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<DB>) };
  } catch {
    return EMPTY;
  }
}

let state: DB = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota / private mode — stay in-memory */
  }
}

function mutate(next: DB) {
  state = next;
  persist();
  listeners.forEach((l) => l());
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

// ---- Sync bridge: the Firebase layer registers a handler here. When null,
// the store is purely local. ----
export type SyncOp =
  | { coll: keyof DB; type: 'set'; item: { id: string } }
  | { coll: keyof DB; type: 'remove'; id: string };

let syncHandler: ((op: SyncOp) => void) | null = null;

export function setSyncHandler(fn: ((op: SyncOp) => void) | null) {
  syncHandler = fn;
}

export function getDB(): DB {
  return state;
}

/** Apply a collection pushed down from the remote. Does NOT echo to sync. */
export function applyRemote<K extends keyof DB>(coll: K, items: DB[K]) {
  mutate({ ...state, [coll]: items } as DB);
}

// ---- Public CRUD (typed at the edges, pragmatic casts inside) ----

export function addItem<K extends keyof DB>(coll: K, item: DB[K][number]) {
  mutate({ ...state, [coll]: [item, ...(state[coll] as unknown[])] } as DB);
  syncHandler?.({ coll, type: 'set', item: item as { id: string } });
}

export function updateItem<K extends keyof DB>(
  coll: K,
  id: string,
  patch: Partial<DB[K][number]>,
) {
  let updated: { id: string } | undefined;
  const list = (state[coll] as { id: string }[]).map((it) => {
    if (it.id === id) {
      updated = { ...it, ...patch };
      return updated;
    }
    return it;
  });
  mutate({ ...state, [coll]: list } as DB);
  if (updated) syncHandler?.({ coll, type: 'set', item: updated });
}

export function removeItem<K extends keyof DB>(coll: K, id: string) {
  const list = (state[coll] as { id: string }[]).filter((it) => it.id !== id);
  mutate({ ...state, [coll]: list } as DB);
  syncHandler?.({ coll, type: 'remove', id });
}

/** Insert or replace by id (used for daily reviews keyed by date). */
export function upsertItem<K extends keyof DB>(coll: K, item: DB[K][number]) {
  const list = state[coll] as { id: string }[];
  const exists = list.some((it) => it.id === (item as { id: string }).id);
  const next = exists
    ? list.map((it) => (it.id === (item as { id: string }).id ? item : it))
    : [item, ...list];
  mutate({ ...state, [coll]: next } as DB);
  syncHandler?.({ coll, type: 'set', item: item as { id: string } });
}

export function clearAll() {
  mutate(structuredClone(EMPTY));
}

// ---- React binding ----

export function useCollection<K extends keyof DB>(coll: K): DB[K] {
  return useSyncExternalStore(
    subscribe,
    () => state[coll],
    () => state[coll],
  );
}

/** Stable unique id. */
export function uid(): string {
  return crypto.randomUUID();
}
