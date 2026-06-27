// Firestore sync layer. Mirrors the local-first store to
// users/{uid}/{collection}/{itemId}. Firebase is dynamically imported so it
// never bloats the core bundle. Offline writes are queued by Firestore's
// persistent cache and reconcile automatically when back online.
import { getFirebase } from '../firebase/config';
import { applyRemote, clearAll, getDB, setSyncHandler } from './store';
import type { DB } from './types';

const COLLS: (keyof DB)[] = ['activities', 'todos', 'habits', 'goals', 'reviews'];
const OWNER_KEY = 'dailytrack.owner';

// Keep the visual order each collection expects after a remote replace.
const sorters: Record<keyof DB, (a: Record<string, unknown>, b: Record<string, unknown>) => number> = {
  activities: (a, b) => String(b.at).localeCompare(String(a.at)),
  todos: (a, b) => String(b.createdAt).localeCompare(String(a.createdAt)),
  habits: (a, b) => String(a.createdAt).localeCompare(String(b.createdAt)),
  goals: (a, b) => String(b.createdAt).localeCompare(String(a.createdAt)),
  reviews: (a, b) => String(b.date).localeCompare(String(a.date)),
};

// ---- Sync error surface (UI subscribes via onSyncError) ----
type ErrCb = (msg: string | null) => void;
const errListeners = new Set<ErrCb>();
let lastError: string | null = null;

export function onSyncError(cb: ErrCb): () => void {
  errListeners.add(cb);
  cb(lastError);
  return () => errListeners.delete(cb);
}

function emitError(msg: string | null) {
  lastError = msg;
  errListeners.forEach((l) => l(msg));
}

function friendly(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  if (code.includes('permission-denied')) {
    return 'Permission denied. Paste the Firestore security rules from the guide below, then reload.';
  }
  const msg = (e as { message?: string })?.message ?? 'Unknown error';
  return `Sync error: ${msg}`;
}

let unsubs: (() => void)[] = [];
let activeUid: string | null = null;

export async function startSync(uid: string) {
  if (activeUid === uid) return;
  const fb = await getFirebase();
  if (!fb) return;
  stopSync();
  activeUid = uid;

  // If a DIFFERENT account previously synced on this device, the local data
  // belongs to them — wipe it so it never leaks into the new account's cloud.
  const prevOwner = localStorage.getItem(OWNER_KEY);
  if (prevOwner && prevOwner !== uid) clearAll();
  localStorage.setItem(OWNER_KEY, uid);

  const { collection, deleteDoc, doc, getDocs, onSnapshot, setDoc, writeBatch } = await import(
    'firebase/firestore'
  );
  const { db } = fb;

  // 1. Bootstrap: push any local-only items up (union by id) so this user's
  //    own pre-sign-in data is preserved and existing remote items aren't
  //    duplicated.
  try {
    const batch = writeBatch(db);
    const local = getDB();
    for (const c of COLLS) {
      const snap = await getDocs(collection(db, 'users', uid, c));
      const remoteIds = new Set(snap.docs.map((d) => d.id));
      for (const item of local[c] as { id: string }[]) {
        if (!remoteIds.has(item.id)) batch.set(doc(db, 'users', uid, c, item.id), item);
      }
    }
    await batch.commit();
    emitError(null);
  } catch (e) {
    emitError(friendly(e));
  }

  // 2. Live listeners: remote → local.
  for (const c of COLLS) {
    const unsub = onSnapshot(
      collection(db, 'users', uid, c),
      (snap) => {
        // A cold persistent cache can emit an empty snapshot before the server
        // responds. Don't let that transient state wipe local data — wait for
        // the authoritative (non-cache) snapshot. A real "deleted everything"
        // arrives from the server (fromCache === false), so deletes still sync.
        if (snap.metadata.fromCache && snap.empty && (getDB()[c] as unknown[]).length > 0) {
          return;
        }
        const items = snap.docs.map((d) => d.data() as Record<string, unknown>);
        items.sort(sorters[c]);
        applyRemote(c, items as unknown as DB[typeof c]);
        emitError(null);
      },
      (e) => emitError(friendly(e)),
    );
    unsubs.push(unsub);
  }

  // 3. Push local mutations → remote.
  setSyncHandler((op) => {
    const ref = doc(db, 'users', uid, op.coll as string, op.type === 'remove' ? op.id : op.item.id);
    const p = op.type === 'remove' ? deleteDoc(ref) : setDoc(ref, op.item);
    p.catch((e) => emitError(friendly(e)));
  });
}

export function stopSync() {
  unsubs.forEach((u) => u());
  unsubs = [];
  setSyncHandler(null);
  activeUid = null;
  emitError(null);
}
