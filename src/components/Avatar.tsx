import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import { AppIcon, getAppBrand } from './AppIcon';
import { Text } from './ui';

export function getInitials(name: string): string {
  if (name.toLowerCase().includes('cse')) return 'UU';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

interface AvatarProps {
  name: string;
  imageUri?: string | null;
  packageName?: string;
  appName?: string;
  size?: number;
  showAppBadge?: boolean;
}

export function Avatar({
  name,
  imageUri,
  packageName = '',
  appName = '',
  size = 46,
  showAppBadge = true,
}: AvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const radius = Math.round(size / 2);
  const badgeSize = Math.max(16, Math.round(size * 0.38));
  const brand = getAppBrand(packageName, appName || name);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUri]);

  const normalizedUri = imageUri
    ? imageUri.startsWith('file://') || imageUri.startsWith('content://') || imageUri.startsWith('http')
      ? imageUri
      : `file://${imageUri}`
    : null;

  const hasValidPhoto = Boolean(normalizedUri && !imageFailed);

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      {hasValidPhoto ? (
        <Image
          source={{ uri: normalizedUri! }}
          onError={() => setImageFailed(true)}
          style={{
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: '#2E323F',
          }}
          resizeMode="cover"
        />
      ) : packageName ? (
        // When packageName is known: show actual real App Icon (never random initials MN, DC, SP)
        <AppIcon
          packageName={packageName}
          name={appName || name}
          size={size}
          shape="circle"
        />
      ) : (
        // Fallback for tests or unknown packages
        <View
          style={{
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: '#0A6C74',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              color: '#FFFFFF',
              fontFamily: 'Manrope_700Bold',
              fontSize: Math.round(size * 0.38),
            }}
          >
            {getInitials(name)}
          </Text>
        </View>
      )}

      {/* Corner app badge (source logo like Facebook, WhatsApp, Insta, Google) */}
      {showAppBadge && packageName ? (
        <View
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: badgeSize,
            height: badgeSize,
            borderRadius: Math.round(badgeSize / 2),
            backgroundColor: brand.bgColor,
            borderWidth: 2,
            borderColor: '#232630',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 1,
            elevation: 3,
          }}
        >
          <Ionicons
            name={brand.iconName}
            size={Math.round(badgeSize * 0.6)}
            color={brand.iconColor}
          />
        </View>
      ) : null}
    </View>
  );
}
