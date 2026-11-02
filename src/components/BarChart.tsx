import { View } from 'react-native';
import { lastDayStarts, weekdayInitial } from '@/lib/time';
import { radius, useTheme } from '@/theme';
import { Text } from './ui';

export function BarChart({ values, now }: { values: number[]; now: number }) {
  const { colors } = useTheme();
  const starts = lastDayStarts(values.length, now);
  const max = Math.max(1, ...values);
  const summary = values.map((v, i) => `${new Date(starts[i] ?? now).toLocaleDateString([], { weekday: 'long' })} ${v}`).join(', ');
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={`Notifications in the last ${values.length} days. ${summary}`} style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 112 }}>
      {values.map((v, i) => {
        const today = i === values.length - 1;
        return (
          <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
            <Text variant="caption" muted style={{ marginBottom: 3 }}>{v > 0 ? v : ''}</Text>
            <View style={{ width: '100%', height: Math.max(6, Math.round((v / max) * 66)), borderRadius: radius.sm, backgroundColor: today ? colors.primary : colors.chartBar }} />
            <Text variant="caption" color={today ? colors.primary : colors.textMuted} style={{ marginTop: 5, fontFamily: undefined }}>{weekdayInitial(starts[i] ?? now)}</Text>
          </View>
        );
      })}
    </View>
  );
}
