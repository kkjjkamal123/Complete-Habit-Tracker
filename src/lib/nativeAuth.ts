// Native (Capacitor) Google sign-in.
//
// Google blocks OAuth inside embedded WebViews ("disallowed_useragent"), so
// signInWithPopup / signInWithRedirect from the Firebase JS SDK do not work in
// the Android app. Instead we use the native @capacitor-firebase/authentication
// plugin (Google Play services / a Custom Tab) and exchange its credential for a
// Firebase JS-SDK session — so the rest of the app (Firestore sync,
// onAuthStateChanged) sees the same signed-in user.
//
// These functions only ever run inside the native app (guarded by
// isNativePlatform() in auth.tsx). The import is a static specifier so Vite
// bundles the plugin into its own lazy chunk: on web that chunk is never
// fetched (signInNative is never reached behind the guard); on the device the
// plugin bridges to native code added by `npx cap sync`. The Android project
// still needs google-services.json + the Google-services gradle plugin and an
// SHA-1 fingerprint registered in Firebase — see ANDROID-SIGNIN.md.
import type { Firebase } from '../firebase/config';

export async function signInNative(fb: Firebase): Promise<void> {
  const [{ FirebaseAuthentication }, auth] = await Promise.all([
    import('@capacitor-firebase/authentication'),
    import('firebase/auth'),
  ]);

  // 1. Native Google sign-in — returns a Google ID token.
  const result = await FirebaseAuthentication.signInWithGoogle();
  const idToken = result.credential?.idToken;
  if (!idToken) {
    throw new Error('Native Google sign-in returned no ID token.');
  }

  // 2. Exchange it for a Firebase JS-SDK session.
  const credential = auth.GoogleAuthProvider.credential(idToken);
  await auth.signInWithCredential(fb.auth, credential);
}

export async function signOutNative(): Promise<void> {
  const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
  await FirebaseAuthentication.signOut();
}
