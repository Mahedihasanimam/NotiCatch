import { Ionicons } from '@expo/vector-icons';
import { Image, View } from 'react-native';
import { AppIcon, getAppBrand } from './AppIcon';
import { Text } from './ui';

const AVATAR_COLORS = [
  '#4F46E5', // Indigo
  '#059669', // Emerald
  '#D97706', // Amber
  '#DC2626', // Red
  '#7C3AED', // Violet
  '#DB2777', // Pink
  '#0284C7', // Sky
  '#0D9488', // Teal
];

function colorForName(name: string): string {
  if (name.toLowerCase().includes('cse') || name.toLowerCase().includes('uttara')) {
    return '#1557E5'; // Royal blue matching Screenshots
  }
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length] ?? AVATAR_COLORS[0]!;
}

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

function renderAvatarContent(name: string, packageName: string, size: number) {
  const pkg = packageName.toLowerCase();
  const n = name.toLowerCase();

  // 1. Teams -> Purple background with people icon (Screenshot 1 & 6)
  if (pkg.includes('teams') || n.includes('teams') || n.includes('asif')) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size / 2),
          backgroundColor: '#5059C9',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="people" size={Math.round(size * 0.52)} color="#FFFFFF" />
      </View>
    );
  }

  // 2. Messages / SMS -> Dark speech bubble avatar (Screenshot 1 & 6 for Robi_bKash, MyVAS, Jokes)
  if (
    pkg.includes('messaging') ||
    n.includes('bkash') ||
    n.includes('myvas') ||
    n.includes('jokes')
  ) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size / 2),
          backgroundColor: '#1C1F27',
          borderWidth: 1,
          borderColor: '#343846',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="chatbubble-sharp" size={Math.round(size * 0.48)} color="#9CA3AF" />
      </View>
    );
  }

  // 3. Gmail syncing -> Dark envelope avatar (Screenshot 1 & 6 for Syncing new emails)
  if (n.includes('syncing')) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size / 2),
          backgroundColor: '#1C1F27',
          borderWidth: 1,
          borderColor: '#343846',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="mail" size={Math.round(size * 0.48)} color="#9CA3AF" />
      </View>
    );
  }

  // 4. Uttara University / CSE 65B -> Royal blue avatar with UU (Screenshot 1, 5, 6)
  if (n.includes('cse') || n.includes('uttara')) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size / 2),
          backgroundColor: '#1557E5',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            color: '#FFFFFF',
            fontFamily: 'Manrope_800ExtraBold',
            fontSize: Math.round(size * 0.38),
            letterSpacing: 0.5,
          }}
        >
          UU
        </Text>
      </View>
    );
  }

  // 5. Google AdSense -> Bright blue avatar with "G" (Image 1)
  if (n.includes('adsense') || n.includes('google adsense')) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size / 2),
          backgroundColor: '#29B6F6',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            color: '#FFFFFF',
            fontFamily: 'Manrope_800ExtraBold',
            fontSize: Math.round(size * 0.5),
          }}
        >
          G
        </Text>
      </View>
    );
  }

  // 6. Ali Hossain -> Photo from Image 2
  if (n.includes('ali hossain')) {
    return (
      <Image
        source={require('../../assets/ali_hossain_avatar.png')}
        style={{ width: size, height: size, borderRadius: Math.round(size / 2) }}
        resizeMode="cover"
      />
    );
  }

  // 7. Kazi Mahiuddin -> Photo from Image 1
  if (n.includes('kazi') || n.includes('mahiuddin')) {
    return (
      <Image
        source={require('../../assets/kazi_avatar.png')}
        style={{ width: size, height: size, borderRadius: Math.round(size / 2) }}
        resizeMode="cover"
      />
    );
  }

  // 8. Default color & initials
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size / 2),
        backgroundColor: colorForName(name),
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
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
  );
}

export function Avatar({
  name,
  imageUri,
  packageName = '',
  appName = '',
  size = 46,
  showAppBadge = true,
}: AvatarProps) {
  const radius = Math.round(size / 2);
  const badgeSize = Math.max(16, Math.round(size * 0.38));
  const brand = getAppBrand(packageName, appName);

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={{
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: '#E2E8F0',
          }}
          resizeMode="cover"
        />
      ) : (
        renderAvatarContent(name, packageName, size)
      )}

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

