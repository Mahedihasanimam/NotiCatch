import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';
import { radius, space, useTheme } from '@/theme';
import { Button, Text, type IconName } from './ui';

export function EmptyState({ icon, title, message, actionLabel, onAction }: { icon: IconName; title: string; message: string; actionLabel?: string; onAction?: () => void }) {
  const { colors } = useTheme();
  return (
    <View accessible accessibilityLabel={`${title}. ${message}`} style={{ alignItems: 'center', paddingVertical: space.xxl * 1.5, paddingHorizontal: space.xl }}>
      <View style={{ width: 84, height: 84, borderRadius: radius.xl, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: space.lg }}>
        <Ionicons name={icon} size={38} color={colors.primary} />
      </View>
      <Text variant="title" style={{ textAlign: 'center' }}>{title}</Text>
      <Text muted style={{ textAlign: 'center', marginTop: space.sm, maxWidth: 320 }}>{message}</Text>
      {actionLabel && onAction ? <Button title={actionLabel} onPress={onAction} style={{ marginTop: space.xl }} /> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <EmptyState icon="alert-circle-outline" title="Something went wrong" message={message} actionLabel={onRetry ? 'Try again' : undefined} onAction={onRetry} />;
}

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  const { colors } = useTheme();
  return (
    <View accessible accessibilityLabel={label} accessibilityRole="progressbar" style={{ padding: space.xxl, alignItems: 'center' }}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}

export function Banner({ icon, title, message, tone = 'warning', actionLabel, onAction }: { icon: IconName; title: string; message: string; tone?: 'warning' | 'info'; actionLabel?: string; onAction?: () => void }) {
  const { colors } = useTheme();
  const bg = tone === 'warning' ? colors.dangerSoft : colors.primarySoft;
  const fg = tone === 'warning' ? colors.danger : colors.primary;
  return (
    <View style={{ backgroundColor: bg, borderRadius: radius.lg, padding: space.lg, gap: space.sm }} accessibilityRole="alert">
      <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'flex-start' }}>
        <Ionicons name={icon} size={22} color={fg} style={{ marginTop: 1 }} />
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong" color={fg}>{title}</Text>
          <Text variant="label" color={colors.text} style={{ marginTop: 2 }}>{message}</Text>
        </View>
      </View>
      {actionLabel && onAction ? <Button title={actionLabel} onPress={onAction} kind={tone === 'warning' ? 'primary' : 'secondary'} /> : null}
    </View>
  );
}
