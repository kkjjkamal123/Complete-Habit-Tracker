// Native (Capacitor) initialisation. No-ops on the web build — only does
// anything inside the Android app.
export async function initNative() {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;

    const [{ StatusBar, Style }, { SplashScreen }] = await Promise.all([
      import('@capacitor/status-bar'),
      import('@capacitor/splash-screen'),
    ]);

    // Android 15+ (targetSdk 35+) forces edge-to-edge, so the WebView already
    // draws under the status bar. Let it overlay transparently and have the CSS
    // safe-area insets (.topbar padding-top) reserve the space — the top bar's
    // own surface then paints cleanly behind the status-bar icons.
    document.documentElement.classList.add('native');
    try {
      await StatusBar.setOverlaysWebView({ overlay: true });
      await StatusBar.setBackgroundColor({ color: '#00000000' });
    } catch {
      /* setOverlaysWebView unsupported on some surfaces */
    }

    // Follow the app's current theme for the status-bar icon colour.
    const setStyle = () => {
      const light = document.documentElement.getAttribute('data-theme') === 'light';
      void StatusBar.setStyle({ style: light ? Style.Light : Style.Dark });
    };
    setStyle();
    // Keep the icons legible when the user flips the theme.
    new MutationObserver(setStyle).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    await SplashScreen.hide();
  } catch {
    /* plugin missing / running on web */
  }
}
