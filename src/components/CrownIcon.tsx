import { FontAwesome5 } from '@expo/vector-icons';
import { View, type ViewStyle } from 'react-native';
import { PressableBounce } from './PressableBounce';

interface CrownIconProps {
  size?: number;
  color?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export function CrownIcon({
  size = 20,
  color = '#FFC107',
  onPress,
  style,
}: CrownIconProps) {
  if (onPress) {
    return (
      <PressableBounce
        hitSlop={14}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="VIP Premium"
        scaleTo={0.88}
        style={[{ padding: 4 }, style]}
      >
        <FontAwesome5 name="crown" size={size} color={color} />
      </PressableBounce>
    );
  }

  return (
    <View pointerEvents="none" style={[{ padding: 4 }, style]}>
      <FontAwesome5 name="crown" size={size} color={color} />
    </View>
  );
}

