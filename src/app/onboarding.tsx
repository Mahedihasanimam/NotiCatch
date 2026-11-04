import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { promptNotificationPermissionIfNeeded } from '@/components/CustomDialog';
import { useAccess } from '@/store/access';
import { useSettings } from '@/store/settings';

export default function Onboarding() {
  const router = useRouter();
  const finish = useSettings((s) => s.update);
  const granted = useAccess((s) => s.granted);
  const { width: windowWidth } = useWindowDimensions();

  // Natural aspect ratio of assets/onbording.png is 852 x 1846
  const imageWidth = windowWidth;
  const imageHeight = (windowWidth * 1846) / 852;

  const handleGetStarted = () => {
    finish({ onboarded: true });
    if (!granted) {
      setTimeout(() => {
        promptNotificationPermissionIfNeeded();
      }, 350);
    }
  };

  const handlePrivacyPress = () => {
    router.push('/settings/privacy');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: imageWidth, height: imageHeight, position: 'relative' }}>
          <Image
            source={require('../../assets/onbording.png')}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />

          {/* Privacy Policy Touchable over the 'Your Privacy, Our Priority' banner */}
          <TouchableOpacity
            activeOpacity={0.7}
            accessibilityRole="link"
            accessibilityLabel="Read Privacy Policy"
            onPress={handlePrivacyPress}
            style={styles.privacyHitArea}
          />

          {/* 'Get Started' Button Touchable Area matching the visual button in onbording.png */}
          <TouchableOpacity
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Get Started"
            onPress={handleGetStarted}
            style={styles.getStartedButton}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F6FA',
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#E8F6FA',
  },
  privacyHitArea: {
    position: 'absolute',
    top: '80%',
    left: '8%',
    width: '84%',
    height: '6%',
    borderRadius: 16,
  },
  getStartedButton: {
    position: 'absolute',
    top: '87%',
    left: '10%',
    width: '80%',
    height: '11%',
    borderRadius: 40,
  },
});
