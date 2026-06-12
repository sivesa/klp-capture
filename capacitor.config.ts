import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'co.kaizenwizard.klpcapture',
  appName: 'KLP Capture',
  webDir: 'build',
  server: {
    androidScheme: 'https',
    allowNavigation: ['lms.kaizenwizard.co.za', 'bff.kaizenwizard.co.za', 'localhost', '127.0.0.1'],
  },
  ios: {
    limitsNavigationsToAppBoundDomains: true,
    scheme: 'klpcapture',
  },
  plugins: {
    Camera: { permissions: ['camera', 'photos'] },
    PushNotifications: { presentationOptions: ['badge', 'sound', 'alert'] },
  },
};

export default config;
