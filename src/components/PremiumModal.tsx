import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PurchasesPackage } from 'react-native-purchases';
import { showAppToast } from './CustomDialog';
import { PressableBounce } from './PressableBounce';
import { Text } from './ui';
import {
  getLastOfferingsError,
  getSubscriptionPackage,
  presentCustomerCenter,
  purchaseSubscription,
  restoreSubscription,
} from '@/lib/purchases';
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
  const [restoring, setRestoring] = useState(false);
  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    let isMounted = true;
    void getSubscriptionPackage().then((fetched) => {
      if (isMounted) {
        if (fetched) {
          setPkg(fetched);
          setLoadError(null);
        } else {
          setLoadError(getLastOfferingsError());
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, [visible]);

  const handleStartTrial = async () => {
    if (activating) return;
    if (isPro) {
      void presentCustomerCenter();
      return;
    }
    setActivating(true);

    try {
      // Initiate Google Play / RevenueCat purchase flow
      const res = await purchaseSubscription(pkg);
      if (res.success) {
        setPro(true);
        showAppToast('🎉 VIP Pass Activated! All features unlocked.', 'success');
        setTimeout(onClose, 600);
      } else if (res.cancelled) {
        // User closed the Google Play payment sheet
      } else {
        showAppToast(res.error || 'Purchase could not be completed.', 'error');
      }
    } catch (e: any) {
      showAppToast(e?.message || 'An error occurred during purchase.', 'error');
    } finally {
      setActivating(false);
    }
  };

  const handleRestore = async () => {
    if (restoring) return;
    setRestoring(true);
    try {
      const res = await restoreSubscription();
      showAppToast(res.message, res.restored ? 'success' : 'info');
      if (res.restored) {
        setTimeout(onClose, 600);
      }
    } catch {
      showAppToast('Could not restore purchases at this time.', 'error');
    } finally {
      setRestoring(false);
    }
  };

  const priceText = pkg?.product?.priceString
    ? `${pkg.product.priceString}/month after FREE 3-day trial`
    : '3-day FREE trial, then monthly auto-renew';

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

            {/* Row 2: Recover Deleted Messages */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <Ionicons name="trash-bin-outline" size={22} color={BRAND_TEAL_VIBRANT} />
                <Text style={{ fontSize: 15, fontFamily: 'Manrope_600SemiBold', color: '#FFFFFF' }}>
                  Recover Deleted Messages
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 50, marginRight: 12 }}>
                <Ionicons name="checkmark" size={20} color={BRAND_TEAL_VIBRANT} />
                <Ionicons name="checkmark" size={20} color={BRAND_TEAL_VIBRANT} />
              </View>
            </View>

            {/* Row 3: Photos & Voice Notes */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <Ionicons name="images-outline" size={22} color={BRAND_TEAL_VIBRANT} />
                <Text style={{ fontSize: 15, fontFamily: 'Manrope_600SemiBold', color: '#FFFFFF' }}>
                  Photos & Voice Notes
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

            {/* Row 5: PIN & Biometric Lock */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <Ionicons name="finger-print-outline" size={22} color={BRAND_TEAL_VIBRANT} />
                <Text style={{ fontSize: 15, fontFamily: 'Manrope_600SemiBold', color: '#FFFFFF' }}>
                  PIN & Biometric Lock
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
            {priceText}
          </Text>

          {/* Validation Notice if Google Play is not signed in or unavailable on this device */}
          {loadError ? (
            <View
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                borderColor: 'rgba(239, 68, 68, 0.35)',
                borderWidth: 1,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                marginBottom: 12,
                width: '100%',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
              <Text
                style={{
                  color: '#FCA5A5',
                  fontSize: 12,
                  fontFamily: 'Manrope_500Medium',
                  flex: 1,
                  lineHeight: 17,
                }}
              >
                {loadError}
              </Text>
            </View>
          ) : null}

          <PressableBounce
            onPress={handleStartTrial}
            disabled={activating}
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
              opacity: activating ? 0.9 : 1,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              {activating && <ActivityIndicator color="#FFFFFF" size="small" />}
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
                {activating
                  ? 'CONNECTING GOOGLE PLAY...'
                  : isPro
                  ? 'MANAGE VIP SUBSCRIPTION'
                  : 'START FREE TRIAL'}
              </Text>
            </View>
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

          {/* Restore Purchases Link (Google Play Requirement) */}
          <TouchableOpacity
            onPress={handleRestore}
            hitSlop={8}
            disabled={restoring}
            style={{ marginTop: 8, paddingVertical: 4 }}
          >
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Manrope_600SemiBold',
                color: BRAND_TEAL_VIBRANT,
                textAlign: 'center',
                textDecorationLine: 'underline',
              }}
            >
              {restoring ? 'Restoring purchases...' : 'Restore Purchases'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
