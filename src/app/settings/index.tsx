import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { showAppConfirm, showAppToast } from '@/components/CustomDialog';
import { PressableBounce } from '@/components/PressableBounce';
import { Text } from '@/components/ui';
import { deleteNotifications, openAccessSettings, queryNotifications } from '@/data/repository';
import { useAccess } from '@/store/access';
import { useDataVersion } from '@/store/dataVersion';
import { useSettings } from '@/store/settings';

export default function SettingsIndexScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const bump = useDataVersion((s) => s.bump);
  const granted = useAccess((s) => s.granted);
  const lockEnabled = useSettings((s) => s.lockEnabled);
  const retentionDays = useSettings((s) => s.retentionDays);

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
            marginBottom: 20,
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
              <Ionicons name="time-outline" size={22} color="#0D9488" />
              <View>
                <Text style={{ fontSize: 15.5, fontFamily: 'Manrope_600SemiBold', color: '#FFFFFF' }}>
                  Automatic Cleanup
                </Text>
                <Text style={{ fontSize: 12.5, color: '#7C8494', marginTop: 1 }}>
                  {retentionDays ? `Keep items for ${retentionDays} days` : 'Keep history forever (No auto-delete)'}
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
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Ionicons name="cloud-upload-outline" size={22} color="#0D9488" />
              <View>
                <Text style={{ fontSize: 15.5, fontFamily: 'Manrope_600SemiBold', color: '#FFFFFF' }}>
                  Backup & Export
                </Text>
                <Text style={{ fontSize: 12.5, color: '#7C8494', marginTop: 1 }}>
                  Export notifications as JSON or restore
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#7C8494" />
          </PressableBounce>
        </View>

        {/* General & Info Section */}
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
          APP INFO & LEGAL
        </Text>

        <View style={{ backgroundColor: '#2E323F', borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
          {/* Privacy Policy */}
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
              <Text style={{ fontSize: 15.5, fontFamily: 'Manrope_600SemiBold', color: '#FFFFFF' }}>
                Privacy Policy
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#7C8494" />
          </PressableBounce>

          {/* About */}
          <PressableBounce
            scaleTo={0.98}
            onPress={() => router.push('/settings/about' as any)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 16,
              paddingHorizontal: 18,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Ionicons name="information-circle-outline" size={22} color="#0D9488" />
              <Text style={{ fontSize: 15.5, fontFamily: 'Manrope_600SemiBold', color: '#FFFFFF' }}>
                About NotiCatch
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#7C8494" />
          </PressableBounce>
        </View>

        {/* Danger Zone: Clear History */}
        <PressableBounce
          scaleTo={0.98}
          onPress={handleClearAllHistory}
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 1,
            borderColor: 'rgba(239, 68, 68, 0.3)',
            borderRadius: 16,
            paddingVertical: 16,
            paddingHorizontal: 18,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
          <Text style={{ fontSize: 15, fontFamily: 'Manrope_700Bold', color: '#EF4444' }}>
            Clear All History
          </Text>
        </PressableBounce>
      </ScrollView>
    </SafeAreaView>
  );
}

