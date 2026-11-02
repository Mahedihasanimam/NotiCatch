import Constants from 'expo-constants';
import { Platform, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Group, Row, Text } from '@/components/ui';
import { radius, space, useTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

export default function About() {
  const { colors } = useTheme();
  const variant = String(Constants.expoConfig?.extra?.variant ?? 'production');
  return (
    <Screen scroll edges={[]}>
      <View style={{ alignItems: 'center', marginVertical: space.xl, gap: space.sm }}>
        <View style={{ width: 84, height: 84, borderRadius: radius.xl, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="notifications" size={40} color={colors.onPrimary} />
        </View>
        <Text variant="title">NotiCatch</Text>
        <Text muted style={{ textAlign: 'center', maxWidth: 300 }}>A private, on-device history of your notifications.</Text>
      </View>
      <Group>
        <Row title="Version" subtitle={Constants.expoConfig?.version ?? '1.0.0'} />
        <Row title="Build" subtitle={variant} />
        <Row title="Android" subtitle={`API level ${Platform.Version}`} />
        <Row title="Data" subtitle="Stored only on this device" last />
      </Group>
      <Text variant="caption" muted style={{ textAlign: 'center' }}>NotiCatch is an independent app and is not affiliated with any notification-history product.</Text>
    </Screen>
  );
}
