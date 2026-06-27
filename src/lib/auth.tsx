import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { isFirebaseConfigured, getFirebase } from '../firebase/config';
import { startSync, stopSync } from './sync';
import { isNativePlatform } from './platform';
import { signInNative, signOutNative } from './nativeAuth';

interface Ctx {
  user: User | null;
  /** auth state resolved */
  ready: boolean;
  /** Firebase configured at all */
  enabled: boolean;
  /** last sign-in error, translated to a readable message (null when clear) */
  authError: string | null;
  signIn: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthCtx = createContext<Ctx>({
  user: null,
  ready: true,
  enabled: false,
  authError: null,
  signIn: async () => {},
  signOutUser: async () => {},
});

/** Translate a Firebase auth error into a message that actually points at the
 *  cause — the old code swallowed the error and always blamed "Google sign-in
 *  isn't enabled", which sent people debugging the wrong thing. */
function authErrorMessage(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/unauthorized-domain':
      return 'This domain isn’t authorised in Firebase. Add it under Authentication → Settings → Authorised domains, then retry.';
    case 'auth/operation-not-supported-in-this-environment':
      return 'Sign-in isn’t supported in this environment. Make sure you’re on this updated build (the desktop app now serves over http so sign-in works).';
    case 'auth/popup-blocked':
      return 'Your browser blocked the sign-in popup. Allow popups for this site, then tap “Sign in with Google” again.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled.';
    case 'auth/network-request-failed':
      return 'Network error during sign-in. Check your connection and try again.';
    case 'auth/internal-error':
      return 'Sign-in failed (internal error). Double-check the Firebase config keys on this page.';
    case 'auth/configuration-not-found':
      return 'Google sign-in isn’t enabled for this project. Enable it under Authentication → Sign-in method → Google.';
    default:
      if (code) return `Sign-in failed (${code}).`;
      return (
        (e as { message?: string })?.message ??
        'Sign-in failed. Check the Firebase config and that Google sign-in is enabled.'
      );
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [enabled] = useState(isFirebaseConfigured);
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!enabled);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let unsub = () => {};
    void (async () => {
      const fb = await getFirebase();
      if (!fb || !active) return;
      const { onAuthStateChanged } = await import('firebase/auth');
      unsub = onAuthStateChanged(fb.auth, (u) => {
        setUser(u);
        setReady(true);
        if (u) {
          setAuthError(null);
          void startSync(u.uid);
        } else {
          stopSync();
        }
      });
    })();
    return () => {
      active = false;
      unsub();
    };
  }, [enabled]);

  const signIn = async () => {
    setAuthError(null);
    try {
      const fb = await getFirebase();
      if (!fb) return;

      // Native app: Google blocks OAuth inside the WebView — use the native plugin.
      if (isNativePlatform()) {
        await signInNative(fb);
        return;
      }

      // Web + desktop (Electron): always use a popup. signInWithRedirect is
      // unreliable in modern browsers with storage partitioning — it fails on
      // return with "missing initial state" — and Firebase itself recommends
      // popup over redirect. Electron is served over http and its main process
      // allows the Google popup window (see electron/main.cjs), so it works there
      // too. A popup is fine on mobile web as well (it's a user-gesture click).
      const { signInWithPopup } = await import('firebase/auth');
      await signInWithPopup(fb.auth, fb.googleProvider);
    } catch (e) {
      setAuthError(authErrorMessage(e));
    }
  };

  const signOutUser = async () => {
    const fb = await getFirebase();
    if (!fb) return;
    stopSync();
    const { signOut } = await import('firebase/auth');
    if (isNativePlatform()) {
      // Also clear the native Google session so the next sign-in can switch
      // accounts instead of silently reusing the last one.
      try {
        await signOutNative();
      } catch {
        /* plugin missing / already signed out */
      }
    }
    await signOut(fb.auth);
  };

  return (
    <AuthCtx.Provider value={{ user, ready, enabled, authError, signIn, signOutUser }}>
      {children}
    </AuthCtx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthCtx);
