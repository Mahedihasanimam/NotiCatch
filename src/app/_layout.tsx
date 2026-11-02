import { Manrope_400Regular, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold, useFonts } from '@expo-google-fonts/manrope';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LockScreen } from '@/components/LockScreen';
import { GlobalDialogOverlay } from '@/components/CustomDialog';
import { Text } from '@/components/ui';
import { clearDemoData } from '@/data/demoData';
import { startAppStateHandling, startNativeSync, startSecureScreenSync, runRetentionCleanup } from '@/data/lifecycle';
import { useAccess } from '@/store/access';
import { startChangeBridge } from '@/store/dataVersion';
import { useSecurity } from '@/store/security';
import { useSettings } from '@/store/settings';
import { fonts, space, ThemeProvider, useTheme } from '@/theme';

void SplashScreen.preventAutoHideAsync();

function Shell() {
  const { colors, isDark } = useTheme();
  const onboarded = useSettings((s) => s.onboarded);
  const locked = useSecurity((s) => s.locked);
  const ready = useSecurity((s) => s.ready);
  const nativeAvailable = useAccess((s) => s.nativeAvailable);
  const { top, bottom } = useSafeAreaInsets();

  useEffect(() => {
    void useSecurity.getState().init();
    void useAccess.getState().refresh();
    void runRetentionCleanup();
    void clearDemoData();
    const disposers = [startNativeSync(), startChangeBridge(), startAppStateHandling(), startSecureScreenSync()];
    // Capture state can change while we are in the foreground (user toggles access in settings overlay).
    return () => disposers.forEach((d) => d());
  }, []);

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  if (!nativeAvailable) {
    return (
      <SafeAreaView
        edges={[]}
        style={[
          { flex: 1, backgroundColor: colors.bg },
          {
            paddingTop: top,
            paddingBottom: bottom,
          },
        ]}
      >
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, gap: space.md }}>
          <Text variant="title" style={{ textAlign: 'center' }}>Android build required</Text>
          <Text muted style={{ textAlign: 'center' }}>
            NotiCatch reads notifications through a native Android service. Run it from a standalone APK or production build — Expo Go and the web are not supported.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={{ flex: 1 }} importantForAccessibility={locked ? 'no-hide-descendants' : 'auto'} accessibilityElementsHidden={locked}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Protected guard={!onboarded}>
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          </Stack.Protected>
          <Stack.Protected guard={onboarded}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="search" options={{ headerShown: false }} />
            <Stack.Screen name="chat/thread" options={{ headerShown: false }} />
            <Stack.Screen name="app-chats/[package]" options={{ headerShown: false }} />
            <Stack.Screen name="notification/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="settings/index" options={{ headerShown: false }} />
            <Stack.Screen name="apps" options={{ headerShown: false }} />
            <Stack.Screen
              name="settings/retention"
              options={{
                headerShown: true,
                title: 'Automatic cleanup',
                headerStyle: { backgroundColor: colors.bg },
                headerTintColor: colors.text,
                headerTitleStyle: { fontFamily: fonts.bold, fontSize: 18 },
                headerShadowVisible: false,
              }}
            />
            <Stack.Screen
              name="settings/security"
              options={{
                headerShown: true,
                title: 'PIN & biometrics',
                headerStyle: { backgroundColor: colors.bg },
                headerTintColor: colors.text,
                headerTitleStyle: { fontFamily: fonts.bold, fontSize: 18 },
                headerShadowVisible: false,
              }}
            />
            <Stack.Screen
              name="settings/backup"
              options={{
                headerShown: true,
                title: 'Backup & export',
                headerStyle: { backgroundColor: colors.bg },
                headerTintColor: colors.text,
                headerTitleStyle: { fontFamily: fonts.bold, fontSize: 18 },
                headerShadowVisible: false,
              }}
            />
            <Stack.Screen
              name="settings/privacy"
              options={{
                headerShown: true,
                title: 'Privacy policy',
                headerStyle: { backgroundColor: colors.bg },
                headerTintColor: colors.text,
                headerTitleStyle: { fontFamily: fonts.bold, fontSize: 18 },
                headerShadowVisible: false,
              }}
            />
            <Stack.Screen
              name="settings/about"
              options={{
                headerShown: true,
                title: 'About',
                headerStyle: { backgroundColor: colors.bg },
                headerTintColor: colors.text,
                headerTitleStyle: { fontFamily: fonts.bold, fontSize: 18 },
                headerShadowVisible: false,
              }}
            />
          </Stack.Protected>
        </Stack>
      </View>
      {locked ? <LockScreen /> : null}
    </View>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({ Manrope_400Regular, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold });
  // If a font fails to load we still render with the system font rather than blocking the app.
  if (!loaded && !error) return null;
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Shell />
        <GlobalDialogOverlay />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
