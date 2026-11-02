import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { PIN_MAX } from '@/lib/pin';
import { radius, space, useTheme } from '@/theme';
import { Text } from './ui';

export function PinDots({ length }: { length: number }) {
  const { colors } = useTheme();
  return (
    <View accessible accessibilityLabel={`${length} digits entered`} style={{ flexDirection: 'row', gap: 14, justifyContent: 'center', minHeight: 24 }}>
      {Array.from({ length: Math.max(4, length) }, (_, i) => (
        <View key={i} style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: i < length ? colors.primary : 'transparent', borderWidth: 2, borderColor: i < length ? colors.primary : colors.textMuted }} />
      ))}
    </View>
  );
}

export function PinPad({ value, onChange, onSubmit, disabled, submitLabel = 'Confirm PIN' }: { value: string; onChange: (v: string) => void; onSubmit: () => void; disabled?: boolean; submitLabel?: string }) {
  const { colors } = useTheme();
  const key = (label: string, onPress: () => void, content: React.ReactNode, accent?: boolean) => (
    <Pressable
      key={label} accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress}
      android_ripple={{ color: colors.primarySoft, radius: 38 }}
      style={{ width: 76, height: 76, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: accent ? colors.primary : colors.surface, borderWidth: 1, borderColor: accent ? colors.primary : colors.border, opacity: disabled ? 0.5 : 1 }}
    >
      {content}
    </Pressable>
  );
  const digit = (d: string) => key(d, () => value.length < PIN_MAX && onChange(value + d), <Text variant="title">{d}</Text>);
  return (
    <View style={{ alignItems: 'center', gap: space.md }}>
      {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9']].map((row) => (
        <View key={row.join('')} style={{ flexDirection: 'row', gap: space.lg }}>{row.map(digit)}</View>
      ))}
      <View style={{ flexDirection: 'row', gap: space.lg }}>
        {key('Delete', () => onChange(value.slice(0, -1)), <Ionicons name="backspace-outline" size={26} color={colors.text} />)}
        {digit('0')}
        {key(submitLabel, onSubmit, <Ionicons name="checkmark" size={30} color={colors.onPrimary} />, true)}
      </View>
    </View>
  );
}
