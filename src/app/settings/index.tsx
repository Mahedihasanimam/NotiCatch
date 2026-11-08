import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Switch, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { showAppConfirm, showAppToast } from '@/components/CustomDialog';
import { PressableBounce } from '@/components/PressableBounce';
import { Text } from '@/components/ui';
import { configureCapture, deleteNotifications, openAccessSettings, openAppSettings, postTestNotification, queryNotifications } from '@/data/repository';
import { CURRENT_APP_VERSION, checkForUpdate, openPlayStore, useUpdateModal } from '@/lib/appUpdate';
import { useAccess } from '@/store/access';
import { useDataVersion } from '@/store/dataVersion';
import { toCaptureConfig, useSettings } from '@/store/settings';

export default function SettingsIndexScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const bump = useDataVersion((s) => s.bump);
  const granted = useAccess((s) => s.granted);
  const lockEnabled = useSettings((s) => s.lockEnabled);
  const retentionDays = useSettings((s) => s.retentionDays);
  const statusBarNotification = useSettings((s) => s.statusBarNotification);
  const notifyOnDeleted = useSettings((s) => s.notifyOnDeleted);
  const updateSettings = useSettings((s) => s.update);
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  const handleCheckUpdate = async () => {
    if (checkingUpdate) return;
    setCheckingUpdate(true);
    showAppToast('Checking for updates...');
    try {
      const res = await checkForUpdate(true);
      if (res.updateAvailable && res.updateInfo) {
        useUpdateModal.getState().showModal(res.updateInfo);
      } else {
        showAppConfirm(
          'You are up to date! 🎉',
          `NotiCatch v${res.currentVersion} is currently the latest version. Would you like to view the Google Play Store listing?`,
          () => {
            void openPlayStore();
          },
          false,
          'Open Play Store',
          'Close',
        );
      }
    } catch {
      showAppToast('Could not check for updates. Check internet connection.', 'error');
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleClearAllHistory = () => {
    showAppConfirm(
      'Clear All Saved History?',
      'All notifications and chat history saved on this device will be permanently deleted. This cannot be undone.',
      async () => {
        try {
          const all = await queryNotifications({ archived: 'include', limit: 5000 });
          if (all.length > 0) {
            await deleteNotifications(all.map((n) => n.id));
            bump();
            showAppToast(`Cleared ${all.length} saved notifications`);
          } else {
            showAppToast('No saved notifications to clear');
          }
        } catch {
          showAppToast('Failed to clear notifications', 'error');
        }
      },
      true,
      'Clear History',
    );
  };

  return (
    <SafeAreaView
      edges={[]}
      style={[
        { flex: 1, backgroundColor: '#232630' },
        {
          paddingTop: top,
          paddingBottom: bottom,
        },
      ]}
    >
      {/* 1. Header with Back Button */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          paddingHorizontal: 20,
          paddingTop: 14,
          paddingBottom: 16,
          backgroundColor: '#232630',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255,255,255,0.06)',
        }}
      >
        <PressableBounce hitSlop={12} onPress={() => router.back()} scaleTo={0.9}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </PressableBounce>

        <Text
          style={{
            fontSize: 22,
            fontFamily: 'Manrope_800ExtraBold',
            color: '#FFFFFF',
            letterSpacing: -0.3,
          }}
        >
          Settings
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Service Status Badge */}
        <PressableBounce
          scaleTo={granted ? 1 : 0.98}
          onPress={() => {
            if (!granted) void openAccessSettings();
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            backgroundColor: granted ? 'rgba(10, 108, 116, 0.25)' : 'rgba(245, 158, 11, 0.12)',
            borderWidth: 1,
            borderColor: granted ? '#0A6C74' : 'rgba(245, 158, 11, 0.4)',
            borderRadius: 14,
            padding: 14,
            marginBottom: granted ? 20 : 12,
          }}
        >
          <Ionicons
            name={granted ? 'checkmark-circle' : 'alert-circle'}
            size={24}
            color={granted ? '#0D9488' : '#F59E0B'}
          />
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#FFFFFF', fontFamily: 'Manrope_700Bold', fontSize: 14 }}>
              {granted ? 'Notification Listener Active' : 'Notification Access Disabled'}
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 2 }}>
              {granted
                ? 'Incoming notifications are being saved in background.'
                : 'Tap here to open Settings and enable notification access.'}
            </Text>
          </View>
          {!granted ? (
            <View
              style={{
                backgroundColor: '#0D9488',
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 12, fontFamily: 'Manrope_700Bold', color: '#FFFFFF' }}>
                Enable
              </Text>
            </View>
          ) : null}
        </PressableBounce>

        {/* Show on Notification Bar (matching Notisave screenshot) */}
        <View
          style={{
            backgroundColor: '#2E323F',
            borderRadius: 14,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
            padding: 14,
            marginBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 10 }}>
            <Ionicons name="notifications" size={22} color="#0D9488" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#FFFFFF', fontFamily: 'Manrope_700Bold', fontSize: 14 }}>
                Show in Notification Bar
              </Text>
              <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 2 }}>
                Display ongoing status with saved count in Android's notification shade (like Notisave).
              </Text>
            </View>
          </View>
          <Switch
            value={statusBarNotification}
            onValueChange={(val) => {
              updateSettings({ statusBarNotification: val });
              void configureCapture(toCaptureConfig({ ...useSettings.getState(), statusBarNotification: val }));
            }}
            trackColor={{ false: '#4B5563', true: '#0A6C74' }}
            thumbColor={statusBarNotification ? '#FFFFFF' : '#9CA3AF'}
          />
        </View>

        {/* Deleted Message Alerts */}
        <View
          style={{
            backgroundColor: '#2E323F',
            padding: 16,
            borderRadius: 14,
            marginBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 10 }}>
            <Ionicons name="alert-circle" size={22} color="#EF4444" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#FFFFFF', fontFamily: 'Manrope_700Bold', fontSize: 14 }}>
                Deleted Message Alerts
              </Text>
              <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 2 }}>
                Get notified immediately when someone deletes a message in WhatsApp, Messenger, etc.
              </Text>
            </View>
          </View>
          <Switch
            value={notifyOnDeleted}
            onValueChange={(val) => {
              updateSettings({ notifyOnDeleted: val });
              void configureCapture(toCaptureConfig({ ...useSettings.getState(), notifyOnDeleted: val }));
            }}
            trackColor={{ false: '#4B5563', true: '#0A6C74' }}
            thumbColor={notifyOnDeleted ? '#FFFFFF' : '#9CA3AF'}
          />
        </View>

        {granted ? (
          <PressableBounce
            scaleTo={0.98}
            onPress={async () => {
              try {
                const ok = await postTestNotification();
                if (ok) {
                  showAppToast('Test notification posted! Check your status bar & home screen.');
                  bump();
                } else {
                  showAppToast('Could not post test notification', 'error');
                }
              } catch {
                showAppToast('Failed to post test notification', 'error');
              }
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              backgroundColor: '#2E323F',
              borderRadius: 14,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
              padding: 14,
              marginBottom: 20,
            }}
          >
            <Ionicons name="notifications-outline" size={22} color="#0A6C74" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#FFFFFF', fontFamily: 'Manrope_700Bold', fontSize: 14 }}>
                Send Test Notification
              </Text>
              <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 2 }}>
                Post a test notification to verify that capture is working properly.
              </Text>
            </View>
            <Ionicons name="paper-plane-outline" size={18} color="#0A6C74" />
          </PressableBounce>
        ) : null}

        {/* Helpful Unlock Card for Android 13+ / Xiaomi / HyperOS */}
        {!granted ? (
          <View
            style={{
              backgroundColor: '#2E323F',
              borderRadius: 14,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
              padding: 14,
              marginBottom: 20,
              gap: 10,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="help-circle-outline" size={18} color="#14B8A6" />
              <Text style={{ fontSize: 13.5, fontFamily: 'Manrope_700Bold', color: '#FFFFFF' }}>
                Switch greyed out in settings?
              </Text>
            </View>
            <Text style={{ fontSize: 12, fontFamily: 'Manrope_500Medium', color: '#9CA3AF', lineHeight: 18 }}>
              On Android 13+ (especially Xiaomi / HyperOS / Samsung), sideloaded apps require one-time approval:
              {'\n'}1. Tap "Open App Info" below
              {'\n'}2. Tap ⋮ (3-dots) in top right ➔ "Allow restricted settings"
              {'\n'}3. Return here and tap "Enable" above to turn on Notification Access.
            </Text>
            <PressableBounce
              scaleTo={0.96}
              onPress={() => void openAppSettings()}
              style={{
                backgroundColor: 'rgba(20, 184, 166, 0.15)',
                borderWidth: 1,
                borderColor: 'rgba(20, 184, 166, 0.4)',
                borderRadius: 8,
                paddingVertical: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 12.5, fontFamily: 'Manrope_700Bold', color: '#14B8A6' }}>
                Open App Info
              </Text>
            </PressableBounce>
          </View>
        ) : null}

        {/* Security & Retention Section */}
        <Text
          style={{
            fontSize: 12.5,
            fontFamily: 'Manrope_700Bold',
            color: '#7C8494',
            letterSpacing: 0.8,
            marginBottom: 10,
            paddingHorizontal: 4,
          }}
        >
          PRIVACY & STORAGE
        </Text>

        <View style={{ backgroundColor: '#2E323F', borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
          {/* Item 1: PIN & biometrics */}
          <PressableBounce
            scaleTo={0.98}
            onPress={() => router.push('/settings/security' as any)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 16,
              paddingHorizontal: 18,
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(255,255,255,0.06)',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Ionicons name="lock-closed-outline" size={22} color="#0D9488" />
              <View>
                <Text style={{ fontSize: 15.5, fontFamily: 'Manrope_600SemiBold', color: '#FFFFFF' }}>
                  PIN & Biometrics
                </Text>
                <Text style={{ fontSize: 12.5, color: '#7C8494', marginTop: 1 }}>
                  {lockEnabled ? 'App lock is ON' : 'Protect history with PIN or fingerprint'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#7C8494" />
          </PressableBounce>

          {/* Item 2: Automatic cleanup */}
          <PressableBounce
            scaleTo={0.98}
            onPress={() => router.push('/settings/retention' as any)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 16,
              paddingHorizontal: 18,
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(255,255,255,0.06)',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Ionicons name="timer-outline" size={22} color="#0D9488" />
              <View>
                <Text style={{ fontSize: 15.5, fontFamily: 'Manrope_600SemiBold', color: '#FFFFFF' }}>
                  Automatic Cleanup
                </Text>
                <Text style={{ fontSize: 12.5, color: '#7C8494', marginTop: 1 }}>
                  {retentionDays === null ? 'Never delete automatically' : `Keep for ${retentionDays} days`}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#7C8494" />
          </PressableBounce>

          {/* Item 3: Backup & Export */}
          <PressableBounce
            scaleTo={0.98}
            onPress={() => router.push('/settings/backup' as any)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 16,
              paddingHorizontal: 18,
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(255,255,255,0.06)',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Ionicons name="download-outline" size={22} color="#0D9488" />
              <View>
                <Text style={{ fontSize: 15.5, fontFamily: 'Manrope_600SemiBold', color: '#FFFFFF' }}>
                  Backup & Export
                </Text>
                <Text style={{ fontSize: 12.5, color: '#7C8494', marginTop: 1 }}>
                  Export to CSV or encrypted JSON
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#7C8494" />
          </PressableBounce>

          {/* Item 4: Clear all notifications */}
          <PressableBounce
            scaleTo={0.98}
            onPress={handleClearAllHistory}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 16,
              paddingHorizontal: 18,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Ionicons name="trash-outline" size={22} color="#EF4444" />
              <View>
                <Text style={{ fontSize: 15.5, fontFamily: 'Manrope_600SemiBold', color: '#EF4444' }}>
                  Clear All History
                </Text>
                <Text style={{ fontSize: 12.5, color: '#7C8494', marginTop: 1 }}>
                  Permanently delete all saved notifications
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#7C8494" />
          </PressableBounce>
        </View>

        {/* General & About Section */}
        <Text
          style={{
            fontSize: 12.5,
            fontFamily: 'Manrope_700Bold',
            color: '#7C8494',
            letterSpacing: 0.8,
            marginBottom: 10,
            paddingHorizontal: 4,
          }}
        >
          ABOUT & LEGAL
        </Text>

        <View style={{ backgroundColor: '#2E323F', borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
          {/* Item 1: Privacy policy */}
          <PressableBounce
            scaleTo={0.98}
            onPress={() => router.push('/settings/privacy' as any)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 16,
              paddingHorizontal: 18,
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(255,255,255,0.06)',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Ionicons name="shield-checkmark-outline" size={22} color="#0D9488" />
              <View>
                <Text style={{ fontSize: 15.5, fontFamily: 'Manrope_600SemiBold', color: '#FFFFFF' }}>
                  Privacy Policy
                </Text>
                <Text style={{ fontSize: 12.5, color: '#7C8494', marginTop: 1 }}>
                  How your data is kept safe on device
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#7C8494" />
          </PressableBounce>

          {/* Item 2: About NotiCatch */}
          <PressableBounce
            scaleTo={0.98}
            onPress={() => router.push('/settings/about' as any)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 16,
              paddingHorizontal: 18,
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(255,255,255,0.06)',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Ionicons name="information-circle-outline" size={22} color="#0D9488" />
              <View>
                <Text style={{ fontSize: 15.5, fontFamily: 'Manrope_600SemiBold', color: '#FFFFFF' }}>
                  About NotiCatch
                </Text>
                <Text style={{ fontSize: 12.5, color: '#7C8494', marginTop: 1 }}>
                  Version {CURRENT_APP_VERSION}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#7C8494" />
          </PressableBounce>

          {/* Item 3: Check for Updates */}
          <PressableBounce
            scaleTo={0.98}
            onPress={() => void handleCheckUpdate()}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 16,
              paddingHorizontal: 18,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Ionicons name="cloud-download-outline" size={22} color="#2DD4BF" />
              <View>
                <Text style={{ fontSize: 15.5, fontFamily: 'Manrope_600SemiBold', color: '#FFFFFF' }}>
                  Check for Updates
                </Text>
                <Text style={{ fontSize: 12.5, color: '#7C8494', marginTop: 1 }}>
                  Tap to check Google Play Store
                </Text>
              </View>
            </View>
            {checkingUpdate ? (
              <ActivityIndicator size="small" color="#2DD4BF" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View
                  style={{
                    backgroundColor: 'rgba(45, 212, 191, 0.12)',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ fontSize: 11, fontFamily: 'Manrope_700Bold', color: '#2DD4BF' }}>
                    v{CURRENT_APP_VERSION}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#7C8494" />
              </View>
            )}
          </PressableBounce>
        </View>

        {/* Footer info */}
        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <Text style={{ fontSize: 12, color: '#7C8494', fontFamily: 'Manrope_500Medium' }}>
            NotiCatch • Private & Local Notification History
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
