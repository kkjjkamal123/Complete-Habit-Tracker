// Runtime-environment detectors. Synchronous and import-free so the auth layer
// can pick the right Firebase sign-in flow per platform without awaiting a
// dynamic import first.
//
//   web      → popup (with redirect fallback)
//   electron → redirect (popups are unreliable in the embedded Chromium window)
//   native   → native Google plugin (Google blocks OAuth in embedded WebViews)

interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
}

function capacitor(): CapacitorGlobal | undefined {
  // Capacitor injects `window.Capacitor` at runtime inside the native app.
  return (globalThis as { Capacitor?: CapacitorGlobal }).Capacitor;
}

/** True inside the Capacitor Android/iOS app. */
export function isNativePlatform(): boolean {
  return Boolean(capacitor()?.isNativePlatform?.());
}

/** 'android' | 'ios' inside the native app, otherwise null. */
export function nativePlatform(): string | null {
  const cap = capacitor();
  return cap?.isNativePlatform?.() ? cap.getPlatform?.() ?? null : null;
}

/** True inside the Electron desktop build. */
export function isElectron(): boolean {
  return typeof navigator !== 'undefined' && /electron/i.test(navigator.userAgent);
}
