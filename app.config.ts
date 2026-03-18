import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Theo',
  slug: 'theo-native',
  version: '1.2.0',
  scheme: 'theo',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  splash: {
    image: './assets/app-loading-screen.png',
    resizeMode: 'cover',
    backgroundColor: '#F5FAF5',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.hellonathanchung.theo',
    buildNumber: '1',
    config: {
      usesNonExemptEncryption: false,
    },
    associatedDomains: ['applinks:theo.nathanchung.com'],
  },
  android: {
    package: 'com.hellonathanchung.theo',
    adaptiveIcon: {
      backgroundColor: '#F5FAF5',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-notifications',
    'expo-localization',
    '@react-native-community/datetimepicker',
  ],
  extra: {
    posthogApiKey: process.env.POSTHOG_API_KEY ?? '',
    supabaseUrl: process.env.SUPABASE_URL ?? '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? '',
    eas: {
      projectId: '354e11a0-1de5-4b99-a963-bb83a020d5f1',
    },
  },
});
