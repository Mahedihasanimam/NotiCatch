import { Ionicons } from '@expo/vector-icons';
import { Image, View } from 'react-native';
import { useAppIcon } from '@/hooks/useAppIcon';
import { radius, useTheme } from '@/theme';
import { Text } from './ui';

const HUES = ['#0A6C74', '#8A5A00', '#5B4B9A', '#B3401E', '#2F6E3D', '#7A3E6B', '#2E5E8C'];

function hueFor(pkg: string): string {
  let h = 0;
  for (let i = 0; i < pkg.length; i++) h = (h * 31 + pkg.charCodeAt(i)) >>> 0;
  return HUES[h % HUES.length] ?? HUES[0]!;
}

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

export interface AppBrand {
  name: string;
  iconName: IconName;
  bgColor: string;
  iconColor: string;
}

export function getAppBrand(packageName: string = '', appName: string = ''): AppBrand {
  const pkg = packageName.toLowerCase();
  const name = appName.toLowerCase();

  // Govt Jobs BD
  if (pkg.includes('govt') || name.includes('govt')) {
    return { name: 'Govt Jobs BD', iconName: 'briefcase', bgColor: '#0F6938', iconColor: '#FFFFFF' };
  }
  // WhatsApp
  if (pkg.includes('whatsapp') || name.includes('whatsapp')) {
    return { name: 'WhatsApp', iconName: 'logo-whatsapp', bgColor: '#25D366', iconColor: '#FFFFFF' };
  }
  // Microsoft Teams
  if (pkg.includes('teams') || name.includes('teams')) {
    return { name: 'Teams', iconName: 'people', bgColor: '#5059C9', iconColor: '#FFFFFF' };
  }
  // Facebook
  if (pkg.includes('katana') || pkg.includes('facebook') || name.includes('facebook')) {
    return { name: 'Facebook', iconName: 'logo-facebook', bgColor: '#1877F2', iconColor: '#FFFFFF' };
  }
  // Telegram
  if (pkg.includes('telegram') || name.includes('telegram') || pkg.includes('challegram')) {
    return { name: 'Telegram', iconName: 'paper-plane', bgColor: '#229ED9', iconColor: '#FFFFFF' };
  }
  // Facebook Messenger
  if (pkg.includes('orca') || name.includes('messenger')) {
    return { name: 'Messenger', iconName: 'chatbubbles', bgColor: '#0084FF', iconColor: '#FFFFFF' };
  }
  // Instagram
  if (pkg.includes('instagram') || name.includes('instagram')) {
    return { name: 'Instagram', iconName: 'logo-instagram', bgColor: '#E4405F', iconColor: '#FFFFFF' };
  }
  // YouTube
  if (pkg.includes('youtube') || name.includes('youtube')) {
    return { name: 'YouTube', iconName: 'logo-youtube', bgColor: '#FF0000', iconColor: '#FFFFFF' };
  }
  // Gmail / Mail
  if (pkg.includes('gm') || pkg.includes('mail') || name.includes('gmail') || name.includes('mail')) {
    return { name: appName || 'Gmail', iconName: 'mail', bgColor: '#EA4335', iconColor: '#FFFFFF' };
  }
  // Chase / Banking
  if (pkg.includes('chase') || pkg.includes('bank') || name.includes('chase') || name.includes('bank')) {
    return { name: appName || 'Bank Alert', iconName: 'shield-checkmark', bgColor: '#117ACA', iconColor: '#FFFFFF' };
  }
  // Signal
  if (pkg.includes('signal') || name.includes('signal')) {
    return { name: 'Signal', iconName: 'chatbubble-ellipses', bgColor: '#3A76F0', iconColor: '#FFFFFF' };
  }
  // Uber / Rides
  if (pkg.includes('uber') || name.includes('uber')) {
    return { name: 'Uber', iconName: 'car', bgColor: '#000000', iconColor: '#FFFFFF' };
  }
  // Maps / Navigation
  if (pkg.includes('maps') || pkg.includes('navigation') || name.includes('map') || name.includes('maps')) {
    return { name: 'Maps', iconName: 'navigate', bgColor: '#34A853', iconColor: '#FFFFFF' };
  }
  // Post Office / Postal Services
  if (pkg.includes('post') || name.includes('post office') || name.includes('postal')) {
    return { name: 'Post Office', iconName: 'cube', bgColor: '#F57C00', iconColor: '#FFFFFF' };
  }
  // Messages / SMS
  if (pkg.includes('messaging') || pkg.includes('mms') || name.includes('message') || name.includes('sms')) {
    return { name: appName || 'Messages', iconName: 'chatbubble-ellipses', bgColor: '#1A73E8', iconColor: '#FFFFFF' };
  }
  // Discord
  if (pkg.includes('discord') || name.includes('discord')) {
    return { name: 'Discord', iconName: 'logo-discord', bgColor: '#5865F2', iconColor: '#FFFFFF' };
  }
  // LinkedIn
  if (pkg.includes('linkedin') || name.includes('linkedin')) {
    return { name: 'LinkedIn', iconName: 'logo-linkedin', bgColor: '#0A66C2', iconColor: '#FFFFFF' };
  }
  // Twitter / X
  if (pkg.includes('twitter') || pkg.includes('x.android') || name.includes('twitter')) {
    return { name: 'Twitter', iconName: 'logo-twitter', bgColor: '#1DA1F2', iconColor: '#FFFFFF' };
  }

  return {
    name: appName || packageName,
    iconName: 'notifications',
    bgColor: hueFor(packageName),
    iconColor: '#FFFFFF',
  };
}

export function AppIcon({
  packageName,
  name,
  size = 44,
  shape = 'circle',
}: {
  packageName: string;
  name: string;
  size?: number;
  shape?: 'circle' | 'squircle';
}) {
  const { colors } = useTheme();
  const icon = useAppIcon(packageName);
  const r = shape === 'circle' ? Math.round(size / 2) : Math.round(size * 0.28);

  if (icon) {
    return (
      <Image
        accessibilityIgnoresInvertColors
        source={{ uri: `data:image/png;base64,${icon}` }}
        style={{ width: size, height: size, borderRadius: r, backgroundColor: colors.surfaceAlt }}
      />
    );
  }

  const brand = getAppBrand(packageName, name);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: r,
        backgroundColor: brand.bgColor,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: brand.bgColor,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      {brand.name === 'LinkedIn' ? (
        <Text style={{ color: '#FFFFFF', fontFamily: 'Manrope_800ExtraBold', fontSize: Math.round(size * 0.46), letterSpacing: -0.5 }}>
          in
        </Text>
      ) : brand.name === 'Uber' ? (
        <Text style={{ color: '#FFFFFF', fontFamily: 'Manrope_800ExtraBold', fontSize: Math.round(size * 0.28), letterSpacing: -0.5 }}>
          uber
        </Text>
      ) : (
        <Ionicons name={brand.iconName} size={Math.round(size * 0.54)} color={brand.iconColor} />
      )}
    </View>
  );
}

export function AppBadge({
  packageName,
  name,
}: {
  packageName: string;
  name: string;
}) {
  const brand = getAppBrand(packageName, name);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: `${brand.bgColor}15`,
        paddingHorizontal: 8,
        paddingVertical: 2.5,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: `${brand.bgColor}40`,
      }}
    >
      <Ionicons name={brand.iconName} size={11} color={brand.bgColor} />
      <Text
        variant="caption"
        style={{
          fontFamily: 'Manrope_700Bold',
          fontSize: 11,
          color: brand.bgColor,
        }}
      >
        {name || brand.name}
      </Text>
    </View>
  );
}
