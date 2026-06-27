// Firebase bootstrap — runtime configurable + lazily loaded.
//
// Config can come from (in priority order):
//   1. Keys pasted into the in-app Sync tab (saved in localStorage)
//   2. Build-time .env (VITE_FIREBASE_*) — for advanced users
// If neither is present, Firebase is never downloaded and the app is fully
// local-first.
import type { FirebaseApp } from 'firebase/app';
import type { Auth, GoogleAuthProvider } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

export interface FbConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const STORE_KEY = 'dailytrack.fbconfig';

export const FB_FIELDS: { key: keyof FbConfig; label: string; required: boolean }[] = [
  { key: 'apiKey', label: 'API key', required: true },
  { key: 'authDomain', label: 'Auth domain', required: false },
  { key: 'projectId', label: 'Project ID', required: true },
  { key: 'storageBucket', label: 'Storage bucket', required: false },
  { key: 'messagingSenderId', label: 'Messaging sender ID', required: false },
  { key: 'appId', label: 'App ID', required: true },
];

function fromEnv(): Partial<FbConfig> {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
}

export function getStoredConfig(): Partial<FbConfig> | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as Partial<FbConfig>) : null;
  } catch {
    return null;
  }
}

export function saveConfig(cfg: Partial<FbConfig>) {
  localStorage.setItem(STORE_KEY, JSON.stringify(cfg));
}

export function clearConfig() {
  localStorage.removeItem(STORE_KEY);
}

function isValid(c: Partial<FbConfig>): boolean {
  return Boolean(c.apiKey && c.projectId && c.appId);
}

/** Firebase's web `authDomain` is always `${projectId}.firebaseapp.com` unless a
 *  custom domain is set. Derive it when the user didn't paste one — without an
 *  authDomain the Google OAuth handler URL doesn't exist and sign-in silently
 *  fails, which is the #1 reason "sign-in does nothing". */
function withDerived(c: Partial<FbConfig>): Partial<FbConfig> {
  if (c.projectId && !c.authDomain?.trim()) {
    return { ...c, authDomain: `${c.projectId}.firebaseapp.com` };
  }
  return c;
}

function resolved(): Partial<FbConfig> {
  const stored = getStoredConfig();
  const base = stored && isValid(stored) ? stored : fromEnv();
  return withDerived(base);
}

export function isFirebaseConfigured(): boolean {
  return isValid(resolved());
}

/** Parse a pasted `firebaseConfig = { … }` snippet (or JSON) into fields. */
export function parseFirebaseConfig(text: string): Partial<FbConfig> {
  const out: Partial<FbConfig> = {};
  for (const { key } of FB_FIELDS) {
    const m = text.match(new RegExp(`${key}\\s*[:=]\\s*["'\`]([^"'\`]+)["'\`]`));
    if (m) out[key] = m[1].trim();
  }
  return out;
}

export interface Firebase {
  app: FirebaseApp;
  db: Firestore;
  auth: Auth;
  googleProvider: GoogleAuthProvider;
}

let cached: Promise<Firebase | null> | null = null;

/** Lazily initialise Firebase. Returns null if not configured. */
export function getFirebase(): Promise<Firebase | null> {
  if (!isFirebaseConfigured()) return Promise.resolve(null);
  if (!cached) cached = init();
  return cached;
}

async function init(): Promise<Firebase> {
  const [{ initializeApp }, { getAuth, GoogleAuthProvider }, fs] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
    import('firebase/firestore'),
  ]);
  const app = initializeApp(resolved());
  const db = fs.initializeFirestore(app, {
    localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }),
  });
  return { app, db, auth: getAuth(app), googleProvider: new GoogleAuthProvider() };
}
