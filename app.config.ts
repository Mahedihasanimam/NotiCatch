import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'NotiCatch',
  slug: 'noticatch',
  owner: 'mahedi25-2',
  scheme: 'noticatch',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: 'com.mehedi.noticatch.app',
    supportsTablet: false,
  },
  android: {
    package: 'com.mehedi.noticatch.app',
    versionCode: 1,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
    adaptiveIcon: {
      backgroundImage: './assets/android-icon-background.png',
      foregroundImage: './assets/android-icon-foreground.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    allowBackup: false, // notification history must not leak through cloud/ADB auto-backup
    blockedPermissions: [
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
    ],
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-local-authentication',
    'expo-sqlite',
    'expo-font',
    'expo-sharing',
    [
      'expo-splash-screen',
      { image: './assets/splash-icon.png', imageWidth: 180, resizeMode: 'contain', backgroundColor: '#0A6C74' },
    ],
    [
      'expo-build-properties',
      {
        android: {
          compileSdkVersion: 37,
          targetSdkVersion: 35,
          buildToolsVersion: '37.0.0',
          minSdkVersion: 26,
          enableMinifyInReleaseBuilds: false,
          enableShrinkResourcesInReleaseBuilds: false,
          useLegacyPackaging: false,
        },
      },
    ],
  ],
  experiments: { typedRoutes: true },
  extra: {
    variant: 'production',
    eas: {
      projectId: process.env.EAS_PROJECT_ID ?? 'd5b16d25-12b1-458c-8ea9-c158abe444e9',
    },
  },
};

export default config;
