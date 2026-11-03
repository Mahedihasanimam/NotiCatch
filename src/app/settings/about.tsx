import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Linking, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { showAppToast } from '@/components/CustomDialog';
import { PressableBounce } from '@/components/PressableBounce';
import { Text } from '@/components/ui';

export default function About() {
  const { top, bottom } = useSafeAreaInsets();
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const variant = String(Constants.expoConfig?.extra?.variant ?? 'Production');

  const handleContactEmail = () => {
    const url = 'mailto:teamriskmade@gmail.com?subject=NotiCatch%20Inquiry';
    Linking.openURL(url).catch(() => {
      showAppToast('Could not open email client');
    });
  };

  return (
    <SafeAreaView
      edges={[]}
      style={[
        { flex: 1, backgroundColor: '#232630' },
        { paddingTop: top, paddingBottom: bottom },
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
          About
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* App Hero Card */}
        <View
          style={{
            backgroundColor: '#2E323F',
            borderRadius: 18,
            padding: 24,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.06)',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 68,
              height: 68,
              borderRadius: 34,
              backgroundColor: 'rgba(10, 108, 116, 0.4)',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1.5,
              borderColor: 'rgba(0, 229, 255, 0.4)',
              marginBottom: 14,
            }}
          >
            <Ionicons name="notifications" size={34} color="#00E5FF" />
          </View>

          <Text
            style={{
              fontSize: 22,
              fontFamily: 'Manrope_800ExtraBold',
              color: '#FFFFFF',
              letterSpacing: -0.3,
            }}
          >
            NotiCatch
          </Text>

          <Text
            style={{
              fontSize: 13.5,
              fontFamily: 'Manrope_500Medium',
              color: '#8E94A5',
              marginTop: 4,
              textAlign: 'center',
            }}
          >
            Smart & Private Notification History
          </Text>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              marginTop: 12,
              backgroundColor: 'rgba(45, 212, 191, 0.12)',
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 20,
            }}
          >
            <Ionicons name="sparkles" size={13} color="#2DD4BF" />
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Manrope_700Bold',
                color: '#2DD4BF',
              }}
            >
              Version {version} • {variant}
            </Text>
          </View>
        </View>

        {/* Mission / Overview Card */}
        <View
          style={{
            backgroundColor: '#2E323F',
            borderRadius: 16,
            padding: 16,
            marginBottom: 14,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.06)',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Ionicons name="information-circle" size={20} color="#00E5FF" />
            <Text style={{ fontSize: 16, fontFamily: 'Manrope_700Bold', color: '#FFFFFF' }}>
              Overview
            </Text>
          </View>
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'Manrope_400Regular',
              color: '#CBD5E1',
              lineHeight: 22,
            }}
          >
            NotiCatch securely records incoming notifications on your device so you can view missed alerts, read deleted messages, and retrieve photos at any time. All data remains exclusively on your phone with zero external tracking.
          </Text>
        </View>

        {/* Specifications / Details Card */}
        <View
          style={{
            backgroundColor: '#2E323F',
            borderRadius: 16,
            overflow: 'hidden',
            marginBottom: 14,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.06)',
          }}
        >
          {/* Row 1 */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 14,
              paddingHorizontal: 16,
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(255,255,255,0.06)',
            }}
          >
            <Text style={{ fontSize: 14, fontFamily: 'Manrope_500Medium', color: '#8E94A5' }}>
              App Version
            </Text>
            <Text style={{ fontSize: 14, fontFamily: 'Manrope_600SemiBold', color: '#FFFFFF' }}>
              {version}
            </Text>
          </View>

          {/* Row 2 */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 14,
              paddingHorizontal: 16,
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(255,255,255,0.06)',
            }}
          >
            <Text style={{ fontSize: 14, fontFamily: 'Manrope_500Medium', color: '#8E94A5' }}>
              Android System
            </Text>
            <Text style={{ fontSize: 14, fontFamily: 'Manrope_600SemiBold', color: '#FFFFFF' }}>
              API level {Platform.Version}
            </Text>
          </View>

          {/* Row 3 */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 14,
              paddingHorizontal: 16,
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(255,255,255,0.06)',
            }}
          >
            <Text style={{ fontSize: 14, fontFamily: 'Manrope_500Medium', color: '#8E94A5' }}>
              Data Storage
            </Text>
            <Text style={{ fontSize: 14, fontFamily: 'Manrope_600SemiBold', color: '#2DD4BF' }}>
              100% On-Device
            </Text>
          </View>

          {/* Row 4 */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 14,
              paddingHorizontal: 16,
            }}
          >
            <Text style={{ fontSize: 14, fontFamily: 'Manrope_500Medium', color: '#8E94A5' }}>
              Developer Team
            </Text>
            <Text style={{ fontSize: 14, fontFamily: 'Manrope_600SemiBold', color: '#FFFFFF' }}>
              Team Risk Made
            </Text>
          </View>
        </View>

        {/* Support & Contact Card */}
        <PressableBounce
          scaleTo={0.98}
          onPress={handleContactEmail}
          style={{
            backgroundColor: '#2E323F',
            borderRadius: 16,
            padding: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.06)',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(0, 229, 255, 0.12)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="mail" size={20} color="#00E5FF" />
            </View>
            <View>
              <Text style={{ fontSize: 15, fontFamily: 'Manrope_700Bold', color: '#FFFFFF' }}>
                Contact Support
              </Text>
              <Text style={{ fontSize: 13, fontFamily: 'Manrope_500Medium', color: '#8E94A5', marginTop: 2 }}>
                teamriskmade@gmail.com
              </Text>
            </View>
          </View>
          <Ionicons name="arrow-forward" size={18} color="#7C8494" />
        </PressableBounce>

        {/* Footer Disclaimer */}
        <View style={{ alignItems: 'center', marginTop: 10 }}>
          <Text
            style={{
              fontSize: 12,
              color: '#7C8494',
              fontFamily: 'Manrope_400Regular',
              textAlign: 'center',
              lineHeight: 18,
            }}
          >
            NotiCatch is an independent application crafted by Team Risk Made.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
