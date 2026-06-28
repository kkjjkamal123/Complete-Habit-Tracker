import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { isFirebaseConfigured, getFirebase } from '../firebase/config';
import { startSync, stopSync } from './sync';
import { isNativePlatform } from './platform';

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

/** Translate a Firebase auth error into a message that points at the real cause. */
function authErrorMessage(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  const msg = (e as { message?: string })?.message ?? '';
  switch (code) {
    case 'auth/unauthorized-domain':
      return 'This domain isn’t authorised in Firebase. Add it under Authentication → Settings → Authorised domains, then retry.';
    case 'auth/operation-not-supported-in-this-environment':
      return 'Sign-in isn’t supported in this environment. Make sure you’re on this updated build (the desktop app serves over http so sign-in works).';
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
      return msg || 'Sign-in failed. Check the Firebase config and that Google sign-in is enabled.';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Cloud sync + Google sign-in are web/desktop only. The Android app is
  // local-first: Google blocks OAuth inside the WebView, and baking in a single
  // google-services.json would hard-wire one Firebase project — wrong for an app
  // where everyone brings their own. So sync stays off on native.
  const [enabled] = useState(() => !isNativePlatform() && isFirebaseConfigured());
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
      // Popup flow (web + desktop). signInWithRedirect breaks on storage-
      // partitioned browsers ("missing initial state"); popup is Firebase's
      // recommended approach and works on mobile web too.
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
