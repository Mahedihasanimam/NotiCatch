import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, ScrollView, Share, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { PremiumModal } from '@/components/PremiumModal';
import { showAppToast } from '@/components/CustomDialog';
import { PressableBounce } from '@/components/PressableBounce';
import { Text } from '@/components/ui';

export function MoreTab() {
  const { top } = useSafeAreaInsets();
  const [showPremium, setShowPremium] = useState(false);

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'Check out NotiCatch - Save notifications and recover deleted messages!',
        title: 'NotiCatch App',
      });
    } catch {}
  };

  const handleOpenInstagram = () => {
    Linking.openURL('https://instagram.com').catch(() => {
      showAppToast('Opening Instagram...');
    });
  };

  const handleOpenHelp = () => {
    router.push('/settings/about' as any);
  };

  return (
    <SafeAreaView
      edges={[]}
      style={[
        { flex: 1, backgroundColor: '#232630' },
        {
          paddingTop: top,
        },
      ]}
    >
      {/* 1. Header: "More" */}
      <View
        style={{
          paddingHorizontal: 22,
          paddingTop: 16,
          paddingBottom: 20,
        }}
      >
        <Text
          style={{
            fontSize: 26,
            fontFamily: 'Manrope_800ExtraBold',
            color: '#FFFFFF',
            letterSpacing: -0.3,
          }}
        >
          More
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 85 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Main Rounded Cards (Block notifications & Settings) */}
        <View style={{ gap: 12, marginBottom: 36 }}>
          {/* Card 1: Block notifications */}
          <PressableBounce
            scaleTo={0.98}
            onPress={() => router.push('/apps')}
            style={{
              backgroundColor: '#2E323F',
              borderRadius: 16,
              paddingVertical: 18,
              paddingHorizontal: 20,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
              <Ionicons name="notifications-off" size={24} color="#FFFFFF" />
              <Text
                style={{
                  fontFamily: 'Manrope_600SemiBold',
                  fontSize: 16.5,
                  color: '#FFFFFF',
                }}
              >
                Block notifications
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#7C8494" />
          </PressableBounce>

          {/* Card 2: Settings */}
          <PressableBounce
            scaleTo={0.98}
            onPress={() => router.push('/settings' as any)}
            style={{
              backgroundColor: '#2E323F',
              borderRadius: 16,
              paddingVertical: 18,
              paddingHorizontal: 20,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
              <Ionicons name="settings" size={24} color="#FFFFFF" />
              <Text
                style={{
                  fontFamily: 'Manrope_600SemiBold',
                  fontSize: 16.5,
                  color: '#FFFFFF',
                }}
              >
                Settings
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#7C8494" />
          </PressableBounce>
        </View>

        {/* 3. Social / Share / Help Simple Rows */}
        <View style={{ paddingHorizontal: 4, gap: 26, marginBottom: 40 }}>
          {/* Instagram */}
          <PressableBounce
            scaleTo={0.97}
            onPress={handleOpenInstagram}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}
          >
            <Ionicons name="logo-instagram" size={26} color="#FFFFFF" />
            <Text
              style={{
                fontFamily: 'Manrope_600SemiBold',
                fontSize: 16,
                color: '#FFFFFF',
              }}
            >
              Instagram
            </Text>
          </PressableBounce>

          {/* Share */}
          <PressableBounce
            scaleTo={0.97}
            onPress={handleShareApp}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}
          >
            <Ionicons name="share-social-outline" size={26} color="#FFFFFF" />
            <Text
              style={{
                fontFamily: 'Manrope_600SemiBold',
                fontSize: 16,
                color: '#FFFFFF',
              }}
            >
              Share app
            </Text>
          </PressableBounce>

          {/* Help & Support */}
          <PressableBounce
            scaleTo={0.97}
            onPress={handleOpenHelp}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}
          >
            <Ionicons name="help-circle-outline" size={26} color="#FFFFFF" />
            <Text
              style={{
                fontFamily: 'Manrope_600SemiBold',
                fontSize: 16,
                color: '#FFFFFF',
              }}
            >
              Help & Support
            </Text>
          </PressableBounce>
        </View>

        {/* 4. App Brand and Version Footer */}
        <View style={{ alignItems: 'center', marginTop: 10 }}>
          <Text
            style={{
              fontSize: 16,
              fontFamily: 'Manrope_700Bold',
              color: '#8E94A5',
              letterSpacing: 0.5,
            }}
          >
            NotiCatch
          </Text>
          <Text
            style={{
              fontSize: 12.5,
              color: '#656C80',
              marginTop: 4,
            }}
          >
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>

      {/* Premium Screen Modal */}
      <PremiumModal visible={showPremium} onClose={() => setShowPremium(false)} />
    </SafeAreaView>
  );
}

