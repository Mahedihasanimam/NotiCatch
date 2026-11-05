import { Ionicons } from '@expo/vector-icons';
import { memo, useState } from 'react';
import {
  Image,
  Pressable,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { showAppConfirm } from './CustomDialog';
import { formatRelative, formatTime } from '@/lib/time';
import type { NotificationRecord } from '@/lib/types';
import { radius, space, useTheme } from '@/theme';
import { AppBadge, AppIcon, getAppBrand } from './AppIcon';
import { Avatar } from './Avatar';
import { Text } from './ui';

interface Props {
  item: NotificationRecord;
  now: number;
  onPress: (item: NotificationRecord) => void;
  onReply?: (item: NotificationRecord) => void;
  onToggleFavorite?: (item: NotificationRecord) => void;
  onDelete?: (item: NotificationRecord) => void;
  selected?: boolean;
  selecting?: boolean;
  onLongPress?: (item: NotificationRecord) => void;
}

function isChatApp(packageName: string = '', appName: string = ''): boolean {
  const p = packageName.toLowerCase();
  const n = appName.toLowerCase();
  return (
    p.includes('whatsapp') ||
    n.includes('whatsapp') ||
    p.includes('telegram') ||
    n.includes('telegram') ||
    p.includes('signal') ||
    n.includes('signal') ||
    p.includes('messenger') ||
    p.includes('orca') ||
    n.includes('messenger') ||
    p.includes('messaging') ||
    p.includes('mms') ||
    n.includes('message') ||
    n.includes('sms') ||
    p.includes('discord')
  );
}

function NotificationFeedCardBase({
  item,
  now,
  onPress,
  onReply,
  onToggleFavorite,
  onDelete,
  selected,
  selecting,
  onLongPress,
}: Props) {
  const { colors, isDark } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const title = item.title ?? item.appName;
  const body = item.text ?? item.bigText ?? '';
  const isChat = isChatApp(item.packageName, item.appName);
  const imageUri = item.mediaPath
    ? item.mediaPath.startsWith('file://')
      ? item.mediaPath
      : `file://${item.mediaPath}`
    : null;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${item.appName} - ${title}:\n${body}`,
      });
    } catch { }
    setMenuOpen(false);
  };

  const showActionsMenu = () => {
    showAppConfirm(
      `Delete notification from ${item.appName}?`,
      `${title}\n${body.slice(0, 80)}${body.length > 80 ? '…' : ''}`,
      () => onDelete?.(item),
      true,
      'Delete',
      'Cancel',
    );
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(item)}
      onLongPress={() => (onLongPress ? onLongPress(item) : showActionsMenu())}
      delayLongPress={350}
      android_ripple={{ color: colors.primarySoft }}
      style={{
        backgroundColor: selected ? colors.primarySoft : colors.surface,
        borderRadius: 14,
        borderWidth: selected ? 1.5 : 0,
        borderColor: selected ? colors.primary : 'transparent',
        padding: 14,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0.25 : 0.05,
        shadowRadius: 3,
        elevation: 2,
      }}
    >
      {/* 1. Header Bar matching Notisave: App Icon + App Name & Time, Bell + Menu on right */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
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
            size={40}
            showAppBadge={true}
          />
          <View>
            <Text
              style={{
                fontFamily: 'Manrope_700Bold',
                fontSize: 14.5,
                color: colors.text,
              }}
            >
              {item.appName}
            </Text>
            <Text variant="caption" muted style={{ fontSize: 11.5, marginTop: 1 }}>
              {formatRelative(item.postedAt, now)}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable
            hitSlop={8}
            onPress={() => onToggleFavorite?.(item)}
            style={{ padding: 2 }}
          >
            <Ionicons
              name={item.isFavorite ? 'notifications' : 'notifications-outline'}
              size={18}
              color={item.isFavorite ? colors.accent : colors.textMuted}
            />
          </Pressable>

          <Pressable
            hitSlop={8}
            onPress={showActionsMenu}
            style={{ padding: 2 }}
          >
            <Ionicons name="ellipsis-vertical" size={17} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>

      {/* 2. Main Content: Title + Body + Badges */}
      <View style={{ paddingLeft: 2 }}>
        {/* Sender / Title */}
        <Text
          variant="bodyStrong"
          numberOfLines={1}
          style={{
            fontSize: 15.5,
            fontFamily: 'Manrope_700Bold',
            color: colors.text,
            letterSpacing: -0.2,
          }}
        >
          {title}
        </Text>

        {/* Message Text */}
        {body ? (
          <Text
            variant="body"
            muted
            numberOfLines={3}
            style={{
              marginTop: 3,
              fontSize: 14,
              lineHeight: 20,
              color: isDark ? '#D1D5DB' : colors.textMuted,
            }}
          >
            {body}
          </Text>
        ) : null}

        {/* Recovered Deleted Banner */}
        {item.isDeleted ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              backgroundColor: colors.dangerSoft,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: radius.sm,
              alignSelf: 'flex-start',
              marginTop: 6,
              borderWidth: 1,
              borderColor: `${colors.danger}30`,
            }}
          >
            <Ionicons name="trash" size={13} color={colors.danger} />
            <Text
              variant="caption"
              color={colors.danger}
              style={{ fontWeight: '700', fontSize: 11.5 }}
            >
              Deleted by sender · Recovered
            </Text>
            {item.deletedAt ? (
              <Text
                variant="caption"
                color={colors.danger}
                style={{ fontSize: 10.5, opacity: 0.8 }}
              >
                ({formatTime(item.deletedAt)})
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* Media / Photo Thumbnail */}
        {imageUri ? (
          <View style={{ marginTop: 8 }}>
            <Image
              source={{ uri: imageUri }}
              style={{
                width: 140,
                height: 90,
                borderRadius: radius.md,
                backgroundColor: colors.surfaceAlt,
              }}
              resizeMode="cover"
            />
            <View
              style={{
                position: 'absolute',
                bottom: 6,
                left: 6,
                backgroundColor: 'rgba(0,0,0,0.65)',
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 4,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <Ionicons name="camera" size={10} color="#FFFFFF" />
              <Text
                variant="caption"
                style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}
              >
                Recovered Photo
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      {/* 3. Bottom Action Strip for Chats */}
      {isChat && onReply ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: space.sm,
            marginTop: 10,
            paddingTop: 8,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.border,
          }}
        >
          <Pressable
            onPress={() => onReply(item)}
            android_ripple={{ color: colors.primarySoft }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: radius.pill,
              backgroundColor: colors.primarySoft,
            }}
          >
            <Ionicons name="arrow-undo" size={14} color={colors.primary} />
            <Text
              variant="caption"
              style={{
                color: colors.primary,
                fontFamily: 'Manrope_700Bold',
                fontSize: 12,
              }}
            >
              Quick Reply
            </Text>
          </Pressable>
        </View>
      ) : null}
    </Pressable>
  );
}

export const NotificationFeedCard = memo(NotificationFeedCardBase);
