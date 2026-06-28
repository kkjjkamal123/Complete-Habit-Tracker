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
  },
};

export default config;
