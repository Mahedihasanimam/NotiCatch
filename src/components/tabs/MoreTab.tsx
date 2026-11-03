import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ImageBackground, Linking, ScrollView, Share, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { PremiumModal } from '@/components/PremiumModal';
import { showAppToast } from '@/components/CustomDialog';
import { PressableBounce } from '@/components/PressableBounce';
import { Text } from '@/components/ui';
import { useSettings } from '@/store/settings';

export function MoreTab() {
  const { top } = useSafeAreaInsets();
  const [showPremium, setShowPremium] = useState(false);
  const isPro = useSettings((s) => s.isPro);

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'Check out NotiCatch - Save notifications and recover deleted messages!',
        title: 'NotiCatch App',
      });
    } catch { }
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
        {/* Sleek Ultra-Premium VIP Banner */}
        <PressableBounce
          scaleTo={0.98}
          activeOpacity={0.92}
          onPress={() => setShowPremium(true)}
          style={{
            marginBottom: 20,
            borderRadius: 18,
            overflow: 'hidden',
            borderWidth: 1.2,
            borderColor: isPro ? 'rgba(45, 212, 191, 0.45)' : 'rgba(251, 191, 36, 0.45)',
            shadowColor: isPro ? '#0D9488' : '#F59E0B',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 10,
            elevation: 5,
          }}
        >
          <ImageBackground
            source={require('../../../assets/vip_banner_bg.jpg')}
            resizeMode="cover"
            style={{ width: '100%' }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 14,
                paddingHorizontal: 16,
                backgroundColor: 'rgba(10, 14, 23, 0.65)',
              }}
            >
              {/* Left: Luxury Crown Badge + Title & Value proposition */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 10 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: isPro ? 'rgba(13, 148, 136, 0.28)' : 'rgba(245, 158, 11, 0.22)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: isPro ? 'rgba(45, 212, 191, 0.45)' : 'rgba(251, 191, 36, 0.45)',
                  }}
                >
                  <Ionicons
                    name={isPro ? 'shield-checkmark' : 'sparkles'}
                    size={22}
                    color={isPro ? '#2DD4BF' : '#FBBF24'}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontFamily: 'Manrope_800ExtraBold',
                        fontSize: 16,
                        color: '#FFFFFF',
                        letterSpacing: -0.2,
                      }}
                    >
                      {isPro ? 'NotiCatch VIP' : 'NotiCatch VIP Pass'}
                    </Text>

                    <View
                      style={{
                        backgroundColor: isPro ? '#0A6C74' : '#F59E0B',
                        paddingHorizontal: 6,
                        paddingVertical: 1.5,
                        borderRadius: 6,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'Manrope_800ExtraBold',
                          fontSize: 9.5,
                          color: isPro ? '#FFFFFF' : '#0F172A',
                          letterSpacing: 0.5,
                        }}
                      >
                        {isPro ? 'PRO' : 'VIP'}
                      </Text>
                    </View>
                  </View>

                  <Text
                    numberOfLines={1}
                    style={{
                      fontFamily: 'Manrope_500Medium',
                      fontSize: 12,
                      color: '#CBD5E1',
                      marginTop: 2.5,
                    }}
                  >
                    {isPro ? 'All VIP features unlocked' : 'Auto-save photos • Lock chats'}
                  </Text>
                </View>
              </View>

              {/* Right: High-End Metallic 3D Button */}
              <View
                style={{
                  backgroundColor: isPro ? 'rgba(45, 212, 191, 0.2)' : '#F59E0B',
                  borderRadius: 12,
                  paddingVertical: 8.5,
                  paddingHorizontal: 13,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  borderTopWidth: 1.2,
                  borderTopColor: isPro ? 'rgba(45, 212, 191, 0.5)' : '#FEF08A',
                  borderBottomWidth: 1.5,
                  borderBottomColor: isPro ? 'rgba(45, 212, 191, 0.2)' : '#B45309',
                  borderLeftWidth: 1,
                  borderLeftColor: isPro ? 'rgba(45, 212, 191, 0.4)' : '#FBBF24',
                  borderRightWidth: 1,
                  borderRightColor: isPro ? 'rgba(45, 212, 191, 0.4)' : '#FBBF24',
                  shadowColor: isPro ? '#0D9488' : '#F59E0B',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.45,
                  shadowRadius: 6,
                  elevation: 5,
                }}
              >
                <Ionicons
                  name={isPro ? 'checkmark-circle' : 'diamond'}
                  size={13}
                  color={isPro ? '#2DD4BF' : '#0F172A'}
                />
                <Text
                  style={{
                    fontFamily: 'Manrope_800ExtraBold',
                    fontSize: 12.5,
                    color: isPro ? '#2DD4BF' : '#0F172A',
                    letterSpacing: 0.5,
                  }}
                >
                  {isPro ? 'ACTIVE' : 'UNLOCK VIP'}
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={12}
                  color={isPro ? '#2DD4BF' : '#0F172A'}
                />
              </View>
            </View>
          </ImageBackground>
        </PressableBounce>

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

