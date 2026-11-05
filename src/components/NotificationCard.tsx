import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Image, Pressable, View } from 'react-native';
import { formatRelative } from '@/lib/time';
import type { NotificationRecord } from '@/lib/types';
import { radius, space, useTheme } from '@/theme';
import { AppBadge, AppIcon } from './AppIcon';
import { Avatar } from './Avatar';
import { Text } from './ui';

export function removalLabel(reason: number | null): string {
  switch (reason) {
    case 1: return 'Opened on device';
    case 2: case 3: return 'Dismissed on device';
    case 8: case 9: return 'Cleared by app';
    default: return 'Removed on device';
  }
}

interface Props {
  item: NotificationRecord;
  now: number;
  selected?: boolean;
  selecting?: boolean;
  showApp?: boolean;
  onPress: (item: NotificationRecord) => void;
  onLongPress?: (item: NotificationRecord) => void;
}

function NotificationCardBase({ item, now, selected, selecting, showApp = true, onPress, onLongPress }: Props) {
  const { colors } = useTheme();
  const title = item.title ?? item.appName;
  const body = item.text ?? item.bigText ?? '';
  const label = [item.appName, title, body, formatRelative(item.postedAt, now), item.isFavorite ? 'favourite' : '', selected ? 'selected' : ''].filter(Boolean).join(', ');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={selecting ? 'Double tap to toggle selection' : 'Opens details. Long press to select'}
      accessibilityState={{ selected: !!selected }}
      onPress={() => onPress(item)}
      onLongPress={() => onLongPress?.(item)}
      delayLongPress={350}
      android_ripple={{ color: colors.primarySoft }}
      style={{
        flexDirection: 'row', gap: space.md, padding: space.md + 2, marginBottom: space.sm, borderRadius: radius.lg,
        backgroundColor: selected ? colors.primarySoft : colors.surface, borderWidth: 1.5,
        borderColor: selected ? colors.primary : colors.border,
      }}
    >
      <View>
        <Avatar
          name={item.title ?? item.appName}
          packageName={item.packageName}
          appName={item.appName}
          imageUri={
            item.mediaPath && item.mediaType === 'image'
              ? item.mediaPath.startsWith('file://')
                ? item.mediaPath
                : `file://${item.mediaPath}`
              : undefined
          }
          size={42}
          showAppBadge={true}
        />
        {selecting ? (
          <View style={{ position: 'absolute', right: -6, bottom: -6, backgroundColor: selected ? colors.primary : colors.surface, borderRadius: 11, borderWidth: 2, borderColor: selected ? colors.primary : colors.textMuted }}>
            <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={selected ? colors.onPrimary : colors.textMuted} />
          </View>
        ) : null}
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {showApp ? <AppBadge packageName={item.packageName} name={item.appName} /> : null}
          <Text variant="caption" muted style={{ flexShrink: 0 }}>{formatRelative(item.postedAt, now)}</Text>
          <View style={{ flex: 1 }} />
          {item.isFavorite ? <Ionicons name="star" size={15} color={colors.accent} /> : null}
          {item.isArchived ? <Ionicons name="archive" size={14} color={colors.textMuted} /> : null}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
          {item.title ? <Text variant="caption" muted style={{ fontSize: 11 }}>From:</Text> : null}
          <Text variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1, fontSize: 15 }}>
            {title}
          </Text>
        </View>

        {body ? <Text variant="body" muted numberOfLines={2} style={{ marginTop: 2 }}>{body}</Text> : null}
        {item.isDeleted ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.dangerSoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginTop: 4 }}>
            <Ionicons name="trash" size={12} color={colors.danger} />
            <Text variant="caption" color={colors.danger} style={{ fontWeight: '700' }}>Deleted by sender</Text>
          </View>
        ) : null}
        {item.mediaPath ? (
          <Image
            source={{ uri: item.mediaPath.startsWith('file://') ? item.mediaPath : `file://${item.mediaPath}` }}
            style={{ width: 80, height: 80, borderRadius: radius.md, marginTop: space.xs, backgroundColor: colors.surfaceAlt }}
            resizeMode="cover"
          />
        ) : null}
        {item.removedAt ? (
          <Text variant="caption" color={colors.textMuted} style={{ marginTop: 4 }}>{removalLabel(item.removalReason)}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export const NotificationCard = memo(NotificationCardBase);
