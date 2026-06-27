import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kamalesh.dailytrack',
  appName: 'DailyTrack',
  webDir: 'dist',
  backgroundColor: '#0e0e12',
  plugins: {
    SplashScreen: {
      launchShowDuration: 500,
      backgroundColor: '#0e0e12',
      showSpinner: false,
    },
    // Native Google sign-in. skipNativeAuth: true → the plugin only performs the
    // Google sign-in and hands back the credential; the app then signs in via the
    // Firebase JS SDK (signInWithCredential) so Firestore sync uses the same user.
    // Requires google-services.json + an SHA-1 fingerprint in Firebase — see
    // ANDROID-SIGNIN.md.
    FirebaseAuthentication: {
      skipNativeAuth: true,
      providers: ['google.com'],
    },
  },
};

export default config;
