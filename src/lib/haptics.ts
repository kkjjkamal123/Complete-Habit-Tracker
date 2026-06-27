// Capacitor-safe haptics. No-ops on web, real vibration in the native
// Android app. The plugin is an OPTIONAL dependency: we import it through a
// non-literal specifier so the web build never hard-depends on it being
// installed (added during the Capacitor/Android phase).

type Style = 'light' | 'medium' | 'heavy' | 'success';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mod: any;

async function load() {
  if (mod !== undefined) return mod;
  try {
    const specifier = '@capacitor/haptics';
    mod = await import(/* @vite-ignore */ specifier);
  } catch {
    mod = null; // plugin not installed / running on web
  }
  return mod;
}

export async function haptic(style: Style = 'light') {
  const m = await load();
  if (!m) {
    // Web fallback: navigator.vibrate where supported.
    navigator.vibrate?.(style === 'heavy' ? 30 : style === 'success' ? [12, 40, 12] : 12);
    return;
  }
  try {
    if (style === 'success') {
      await m.Haptics.notification({ type: m.NotificationType.Success });
    } else {
      const map = { light: m.ImpactStyle.Light, medium: m.ImpactStyle.Medium, heavy: m.ImpactStyle.Heavy };
      await m.Haptics.impact({ style: map[style] });
    }
  } catch {
    /* ignore */
  }
}
