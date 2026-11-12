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
  // Android only: iOS has no API for reading other apps' notifications.
  platforms: ['android'],
  android: {
    package: 'com.mehedi.noticatch.app',
    versionCode: 3,
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
          targetSdkVersion: 36,
          buildToolsVersion: '37.0.0',
          minSdkVersion: 26,
          // R8: smaller APK/AAB (matters on slow mobile data). Native libs ship their own
          // consumer rules; the extra keeps below are belt-and-braces for reflection-heavy SDKs.
          enableMinifyInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
          extraProguardRules: [
            '-keep class com.revenuecat.purchases.** { *; }',
            '-keep class expo.modules.keepsake.** { *; }',
            '-keep class com.google.android.play.core.** { *; }',
          ].join('\n'),
          useLegacyPackaging: false,
        },
      },
    ],
  ],
  experiments: { typedRoutes: true },
  extra: {
    variant: 'production',
    eas: {
      projectId: process.env.EAS_PROJECT_ID ?? '527e76ee-b657-41e4-9dad-28f9ae409c59',
    },
  },
};

export default config;
