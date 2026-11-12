import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { showAppToast } from './CustomDialog';
import { PressableBounce } from './PressableBounce';
import { Text } from './ui';
import {
  CURRENT_APP_VERSION,
  formatVersion,
  startUpdate,
  useUpdateModal,
} from '@/lib/appUpdate';

export function AppUpdateModal() {
  const { isVisible, updateInfo, hideModal } = useUpdateModal();

  if (!isVisible || !updateInfo) return null;

  const isForce = Boolean(updateInfo.forceUpdate);
  const title = updateInfo.title || 'New Update Available! 🚀';
  const message =
    updateInfo.message ||
    'A new version of NotiCatch is available! Update now to get the latest features, performance improvements, and bug fixes.';

  const handleUpdate = async () => {
    const result = await startUpdate(updateInfo);
    if (result === 'failed') {
      showAppToast('Could not open Google Play Store', 'error');
    } else if (result === 'play' && !isForce) {
      showAppToast('Downloading update… NotiCatch will restart when it is ready.');
    }
    if (!isForce || result === 'play') {
      hideModal();
    }
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={isVisible}
      onRequestClose={() => {
        if (!isForce) hideModal();
      }}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(11, 15, 23, 0.82)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 24,
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 380,
            backgroundColor: '#232630',
            borderRadius: 24,
            padding: 24,
            borderWidth: 1.5,
            borderColor: 'rgba(45, 212, 191, 0.25)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.5,
            shadowRadius: 20,
            elevation: 12,
          }}
        >
          {/* Top Glowing Icon Badge */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: 'rgba(13, 148, 136, 0.16)',
                borderWidth: 2,
                borderColor: '#0D9488',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#0D9488',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 10,
              }}
            >
              <Ionicons name="rocket" size={32} color="#2DD4BF" />
            </View>
          </View>

          {/* Title */}
          <Text
            style={{
              fontSize: 20,
              fontFamily: 'Manrope_800ExtraBold',
              color: '#FFFFFF',
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            {title}
          </Text>

          {/* Version badge */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <View
              style={{
                backgroundColor: '#2E323F',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 12, fontFamily: 'Manrope_600SemiBold', color: '#9CA3AF' }}>
                Current v{CURRENT_APP_VERSION}
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={14} color="#2DD4BF" />
            <View
              style={{
                backgroundColor: 'rgba(45, 212, 191, 0.15)',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: 'rgba(45, 212, 191, 0.3)',
              }}
            >
              <Text style={{ fontSize: 12, fontFamily: 'Manrope_700Bold', color: '#2DD4BF' }}>
                Latest {formatVersion(updateInfo.latestVersion)}
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'Manrope_500Medium',
              color: '#D1D5DB',
              textAlign: 'center',
              lineHeight: 21,
              marginBottom: 16,
            }}
          >
            {message}
          </Text>

          {/* Release Notes Box */}
          {updateInfo.releaseNotes ? (
            <View
              style={{
                backgroundColor: '#1E212B',
                borderRadius: 12,
                padding: 12,
                marginBottom: 20,
                maxHeight: 130,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.05)',
              }}
            >
              <Text
                style={{
                  fontSize: 11.5,
                  fontFamily: 'Manrope_700Bold',
                  color: '#7C8494',
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  marginBottom: 6,
                }}
              >
                What's New:
              </Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text
                  style={{
                    fontSize: 12.5,
                    fontFamily: 'Manrope_500Medium',
                    color: '#9CA3AF',
                    lineHeight: 18,
                  }}
                >
                  {updateInfo.releaseNotes}
                </Text>
              </ScrollView>
            </View>
          ) : null}

          {/* Action Buttons */}
          <View style={{ gap: 10 }}>
            {/* Update Now Button */}
            <PressableBounce
              scaleTo={0.96}
              onPress={() => void handleUpdate()}
              style={{
                backgroundColor: '#0D9488',
                borderRadius: 14,
                paddingVertical: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                shadowColor: '#0D9488',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}
            >
              <Ionicons name="logo-google-playstore" size={18} color="#FFFFFF" />
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 15.5,
                  fontFamily: 'Manrope_700Bold',
                  letterSpacing: 0.2,
                }}
              >
                Update Now
              </Text>
            </PressableBounce>

            {/* Later Button (only if not a forced update) */}
            {!isForce ? (
              <Pressable
                onPress={hideModal}
                style={({ pressed }) => ({
                  paddingVertical: 10,
                  alignItems: 'center',
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Text
                  style={{
                    color: '#7C8494',
                    fontSize: 14,
                    fontFamily: 'Manrope_600SemiBold',
                  }}
                >
                  Later
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

