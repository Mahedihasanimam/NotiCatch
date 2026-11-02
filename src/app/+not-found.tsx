import { Link } from 'expo-router';
import { View } from 'react-native';
import { Text } from '@/components/ui';
import { space } from '@/theme';

export default function NotFound() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md, padding: space.xl }}>
      <Text variant="title">Page not found</Text>
      <Link href="/" accessibilityRole="link"><Text color="#0A6C74" variant="bodyStrong">Back to Home</Text></Link>
    </View>
  );
}
