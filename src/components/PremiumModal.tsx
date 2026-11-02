import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { showAppToast } from './CustomDialog';
import { PressableBounce } from './PressableBounce';
import { Text } from './ui';
import { useSettings } from '@/store/settings';

interface Props {
  visible: boolean;
  onClose: () => void;
}

// App Logo Brand Colors (Teal theme matching assets/icon.png)
const BRAND_TEAL = '#0A6C74';
const BRAND_TEAL_VIBRANT = '#0D9488';

export function PremiumModal({ visible, onClose }: Props) {
  const { top, bottom } = useSafeAreaInsets();
  const isPro = useSettings((s) => s.isPro);
  const setPro = useSettings((s) => s.setPro);
  const [activating, setActivating] = useState(false);

  const handleStartTrial = () => {
    setActivating(true);
    setPro(true);
    showAppToast('🎉 3-Day Free Trial Activated! VIP features unlocked.');
    setTimeout(() => {
      setActivating(false);
      onClose();
    }, 800);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
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
        {/* Top Close Button */}
        <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 6 }}>
          <PressableBounce hitSlop={14} onPress={onClose} scaleTo={0.88}>
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </PressableBounce>
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 22,
            paddingTop: 6,
            paddingBottom: 24,
            alignItems: 'center',
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Brand Teal Ribbon Award Icon (App Logo Color) */}
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: 'rgba(10, 108, 116, 0.15)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}
          >
            <Ionicons name="ribbon-outline" size={48} color={BRAND_TEAL_VIBRANT} />
          </View>

          {/* Title & Subtitle */}
          <Text
            style={{
              fontSize: 26,
              fontFamily: 'Manrope_800ExtraBold',
              color: '#FFFFFF',
              letterSpacing: 0.5,
              marginBottom: 4,
              textAlign: 'center',
            }}
          >
            START LIKE A PRO
          </Text>
          <Text
            style={{
              fontSize: 15.5,
              fontFamily: 'Manrope_600SemiBold',
              color: '#9CA3AF',
              marginBottom: 20,
              textAlign: 'center',
            }}
          >
            Unlock All Features
          </Text>

          {/* Active Pro Banner (if already active) */}
          {isPro ? (
            <View
              style={{
                width: '100%',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                backgroundColor: 'rgba(10, 108, 116, 0.25)',
                borderWidth: 1,
                borderColor: BRAND_TEAL,
                borderRadius: 14,
                padding: 14,
                marginBottom: 20,
              }}
            >
              <Ionicons name="checkmark-circle" size={22} color={BRAND_TEAL_VIBRANT} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#FFFFFF', fontFamily: 'Manrope_700Bold', fontSize: 14 }}>
                  Trial Active • VIP Pro Member
                </Text>
                <Text style={{ color: '#8AC4C9', fontSize: 12, marginTop: 2 }}>
                  All premium features are unlocked on this device.
                </Text>
              </View>
            </View>
          ) : null}

          {/* Comparison Table Header */}
          <View
            style={{
              width: '100%',
              flexDirection: 'row',
              justifyContent: 'flex-end',
              paddingBottom: 12,
              paddingRight: 6,
              gap: 28,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Manrope_700Bold',
                color: BRAND_TEAL_VIBRANT,
                letterSpacing: 0.8,
              }}
            >
              PREMIUM
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Manrope_700Bold',
                color: '#7C8494',
                letterSpacing: 0.8,
              }}
            >
              BASIC
            </Text>
          </View>

          {/* Table Rows Card Container matching App Dark Theme */}
          <View
            style={{
              width: '100%',
              backgroundColor: '#2E323F',
              borderRadius: 16,
              paddingVertical: 18,
              paddingHorizontal: 16,
              gap: 18,
            }}
          >
            {/* Row 1: Save Notifications */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <Ionicons name="save-outline" size={22} color={BRAND_TEAL_VIBRANT} />
                <Text style={{ fontSize: 15, fontFamily: 'Manrope_600SemiBold', color: '#FFFFFF' }}>
                  Save Notifications
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 50, marginRight: 12 }}>
                <Ionicons name="checkmark" size={20} color={BRAND_TEAL_VIBRANT} />
                <Ionicons name="checkmark" size={20} color={BRAND_TEAL_VIBRANT} />
              </View>
            </View>

            {/* Row 2: Manage Notifications */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <Ionicons name="notifications-outline" size={22} color={BRAND_TEAL_VIBRANT} />
                <Text style={{ fontSize: 15, fontFamily: 'Manrope_600SemiBold', color: '#FFFFFF' }}>
                  Manage Notifications
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 50, marginRight: 12 }}>
                <Ionicons name="checkmark" size={20} color={BRAND_TEAL_VIBRANT} />
                <Ionicons name="checkmark" size={20} color={BRAND_TEAL_VIBRANT} />
              </View>
            </View>

            {/* Row 3: Add to Groups */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <Ionicons name="scan-outline" size={22} color={BRAND_TEAL_VIBRANT} />
                <Text style={{ fontSize: 15, fontFamily: 'Manrope_600SemiBold', color: '#FFFFFF' }}>
                  Add to Groups
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 50, marginRight: 12 }}>
                <Ionicons name="checkmark" size={20} color={BRAND_TEAL_VIBRANT} />
                <Ionicons name="checkmark" size={20} color={BRAND_TEAL_VIBRANT} />
              </View>
            </View>

            {/* Row 4: VIP Customer Support */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <Ionicons name="headset-outline" size={22} color={BRAND_TEAL_VIBRANT} />
                <Text style={{ fontSize: 15, fontFamily: 'Manrope_600SemiBold', color: '#FFFFFF' }}>
                  VIP Customer Support
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 52, marginRight: 14 }}>
                <Ionicons name="checkmark" size={20} color={BRAND_TEAL_VIBRANT} />
                <Text style={{ color: BRAND_TEAL_VIBRANT, fontSize: 18, fontWeight: '700' }}>—</Text>
              </View>
            </View>

            {/* Row 5: Remove Ads */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <Ionicons name="ban-outline" size={22} color={BRAND_TEAL_VIBRANT} />
                <Text style={{ fontSize: 15, fontFamily: 'Manrope_600SemiBold', color: '#FFFFFF' }}>
                  Remove Ads
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 52, marginRight: 14 }}>
                <Ionicons name="checkmark" size={20} color={BRAND_TEAL_VIBRANT} />
                <Text style={{ color: BRAND_TEAL_VIBRANT, fontSize: 18, fontWeight: '700' }}>—</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Fixed Action Footer matching Screenshot 6 */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 20,
            backgroundColor: '#232630',
            borderTopWidth: 1,
            borderTopColor: 'rgba(255, 255, 255, 0.05)',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'Manrope_600SemiBold',
              color: '#9CA3AF',
              marginBottom: 10,
              textAlign: 'center',
            }}
          >
            BDT 1,300.00/week after FREE 3-day trial
          </Text>

          <PressableBounce
            onPress={handleStartTrial}
            scaleTo={0.96}
            style={{
              width: '100%',
              minHeight: 52,
              paddingVertical: 14,
              paddingHorizontal: 20,
              borderRadius: 26,
              backgroundColor: BRAND_TEAL,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: BRAND_TEAL,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{
                color: '#FFFFFF',
                fontFamily: 'Manrope_800ExtraBold',
                fontSize: 15.5,
                letterSpacing: 0.8,
                textAlign: 'center',
              }}
            >
              {activating ? 'ACTIVATING VIP...' : isPro ? 'VIP ACTIVE' : 'START FREE TRIAL'}
            </Text>
          </PressableBounce>

          <Text
            style={{
              fontSize: 11,
              fontFamily: 'Manrope_400Regular',
              color: '#7C8494',
              textAlign: 'center',
              marginTop: 10,
              lineHeight: 16,
              paddingHorizontal: 6,
            }}
          >
            Subscription is billed after the trial ends and will auto-renew. Cancel
            subscription anytime before trial ends to avoid charges.
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
