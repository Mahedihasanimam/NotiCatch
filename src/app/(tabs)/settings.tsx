import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, ScrollView, Share, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { PremiumModal } from '@/components/PremiumModal';
import { showAppToast } from '@/components/CustomDialog';
import { PressableBounce } from '@/components/PressableBounce';
import { Text } from '@/components/ui';

export default function MoreScreen() {
  const { top } = useSafeAreaInsets();
  const [showPremium, setShowPremium] = useState(false);

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'Check out NotiSave - Save notifications and recover deleted messages!',
        title: 'NotiSave App',
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
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
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
              <Ionicons name="settings-sharp" size={24} color="#FFFFFF" />
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

        {/* 3. Four Grid Action Icons matching Screenshot 3 */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around',
            paddingHorizontal: 8,
          }}
        >
          {/* Action 1: Instagram */}
          <PressableBounce
            scaleTo={0.9}
            onPress={handleOpenInstagram}
            style={{ alignItems: 'center', gap: 8, minWidth: 64 }}
          >
            <Ionicons name="logo-instagram" size={30} color="#FFFFFF" />
            <Text style={{ fontSize: 13, color: '#D1D5DB', fontFamily: 'Manrope_500Medium' }}>
              Instagram
            </Text>
          </PressableBounce>

          {/* Action 2: Tell friends */}
          <PressableBounce
            scaleTo={0.9}
            onPress={handleShareApp}
            style={{ alignItems: 'center', gap: 8, minWidth: 64 }}
          >
            <Ionicons name="megaphone-outline" size={30} color="#FFFFFF" />
            <Text style={{ fontSize: 13, color: '#D1D5DB', fontFamily: 'Manrope_500Medium' }}>
              Tell friends
            </Text>
          </PressableBounce>

          {/* Action 3: Ad-free */}
          <PressableBounce
            scaleTo={0.9}
            onPress={() => setShowPremium(true)}
            style={{ alignItems: 'center', gap: 8, minWidth: 64 }}
          >
            <Ionicons name="ban-outline" size={30} color="#FFFFFF" />
            <Text style={{ fontSize: 13, color: '#D1D5DB', fontFamily: 'Manrope_500Medium' }}>
              Ad-free
            </Text>
          </PressableBounce>

          {/* Action 4: Help */}
          <PressableBounce
            scaleTo={0.9}
            onPress={handleOpenHelp}
            style={{ alignItems: 'center', gap: 8, minWidth: 64 }}
          >
            <Ionicons name="help-circle-outline" size={30} color="#FFFFFF" />
            <Text style={{ fontSize: 13, color: '#D1D5DB', fontFamily: 'Manrope_500Medium' }}>
              Help
            </Text>
          </PressableBounce>
        </View>
      </ScrollView>

      {/* Premium / VIP Modal */}
      <PremiumModal visible={showPremium} onClose={() => setShowPremium(false)} />
    </SafeAreaView>
  );
}
