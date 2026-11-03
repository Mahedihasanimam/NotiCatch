import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableBounce } from '@/components/PressableBounce';
import { Text } from '@/components/ui';
import { PRIVACY_POLICY } from '@/lib/privacyPolicy';

const SECTION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Summary: 'shield-checkmark-outline',
  'What NotiCatch reads': 'notifications-outline',
  'Where it is stored': 'phone-portrait-outline',
  'What is shared': 'share-social-outline',
  'Your controls': 'options-outline',
  'Sensitive content': 'lock-closed-outline',
  Children: 'people-outline',
  'Changes and contact': 'mail-outline',
};

export default function Privacy() {
  const { top, bottom } = useSafeAreaInsets();

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
          Privacy Policy
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Hero Card */}
        <View
          style={{
            backgroundColor: '#2E323F',
            borderRadius: 18,
            padding: 20,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.06)',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 58,
              height: 58,
              borderRadius: 29,
              backgroundColor: 'rgba(10, 108, 116, 0.35)',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1.5,
              borderColor: 'rgba(0, 229, 255, 0.4)',
              marginBottom: 12,
            }}
          >
            <Ionicons name="shield-checkmark" size={30} color="#00E5FF" />
          </View>

          <Text
            style={{
              fontSize: 18,
              fontFamily: 'Manrope_800ExtraBold',
              color: '#FFFFFF',
              textAlign: 'center',
            }}
          >
            {PRIVACY_POLICY.title}
          </Text>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              marginTop: 8,
              backgroundColor: 'rgba(45, 212, 191, 0.12)',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 20,
            }}
          >
            <Ionicons name="checkmark-circle" size={14} color="#2DD4BF" />
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Manrope_600SemiBold',
                color: '#2DD4BF',
              }}
            >
              100% On-Device • No Internet Required
            </Text>
          </View>

          <Text
            style={{
              fontSize: 12,
              fontFamily: 'Manrope_500Medium',
              color: '#7C8494',
              marginTop: 8,
            }}
          >
            Last updated: {PRIVACY_POLICY.updated}
          </Text>
        </View>

        {/* Policy Sections */}
        <View style={{ gap: 12 }}>
          {PRIVACY_POLICY.sections.map((s) => {
            const iconName = SECTION_ICONS[s.heading] || 'document-text-outline';
            return (
              <View
                key={s.heading}
                style={{
                  backgroundColor: '#2E323F',
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.06)',
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 8,
                  }}
                >
                  <Ionicons name={iconName} size={20} color="#00E5FF" />
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: 'Manrope_700Bold',
                      color: '#FFFFFF',
                    }}
                  >
                    {s.heading}
                  </Text>
                </View>

                <Text
                  selectable
                  style={{
                    fontSize: 14,
                    fontFamily: 'Manrope_400Regular',
                    color: '#CBD5E1',
                    lineHeight: 22,
                  }}
                >
                  {s.body}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Footer */}
        <View style={{ alignItems: 'center', marginTop: 24 }}>
          <Text
            style={{
              fontSize: 12.5,
              color: '#7C8494',
              fontFamily: 'Manrope_500Medium',
              textAlign: 'center',
            }}
          >
            NotiCatch • Your privacy is our priority
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
