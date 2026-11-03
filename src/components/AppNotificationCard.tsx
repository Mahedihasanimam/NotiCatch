import { Ionicons } from '@expo/vector-icons';
import { memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { cleanChatTitle } from '@/lib/chat';
import { formatNotisaveRelative } from '@/lib/time';
import type { NotificationRecord } from '@/lib/types';
import { AppIcon } from './AppIcon';
import { PressableBounce } from './PressableBounce';
import { Text } from './ui';

export interface AppGroup {
  packageName: string;
  appName: string;
  lastPostedAt: number;
  items: NotificationRecord[];
}

interface Props {
  group: AppGroup;
  now: number;
  onPress: (group: AppGroup) => void;
  onPressItem?: (item: NotificationRecord) => void;
  onOpenMenu: (group: AppGroup) => void;
  isMuted?: boolean;
  onToggleMute?: (group: AppGroup) => void;
}

function AppNotificationCardBase({
  group,
  now,
  onPress,
  onPressItem,
  onOpenMenu,
  isMuted = false,
  onToggleMute,
}: Props) {
  const isWhatsApp = group.packageName.toLowerCase().includes('whatsapp');
  const unreadCount = group.items.filter((i) => !i.isArchived).length;

  // Group notifications inside this app card by contact / conversation
  const groupedItems = useMemo(() => {
    const map = new Map<string, {
      title: string;
      latestItem: NotificationRecord;
      count: number;
      unreadCount: number;
      isDeleted: boolean;
    }>();

    for (const item of group.items) {
      const rawTitle = item.title ?? group.appName;
      const cleanTitle = cleanChatTitle(rawTitle) || group.appName;
      const existing = map.get(cleanTitle);

      if (!existing) {
        map.set(cleanTitle, {
          title: cleanTitle,
          latestItem: item,
          count: 1,
          unreadCount: !item.isArchived ? 1 : 0,
          isDeleted: item.isDeleted,
        });
      } else {
        existing.count += 1;
        if (!item.isArchived) existing.unreadCount += 1;
        if (item.isDeleted) existing.isDeleted = true;
        if (item.postedAt > existing.latestItem.postedAt) {
          existing.latestItem = item;
        }
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => b.latestItem.postedAt - a.latestItem.postedAt,
    );
  }, [group.items, group.appName]);

  return (
    <PressableBounce
      onPress={() => onPress(group)}
      scaleTo={0.98}
      activeOpacity={0.92}
      style={{
        backgroundColor: '#2E323F',
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
        elevation: 2,
      }}
    >
      {/* 1. Header Row: App Icon + Name + Timestamp + Unread badge + Bell + 3-dots */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <AppIcon
            packageName={group.packageName}
            name={group.appName}
            size={38}
            shape="squircle"
          />
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text
                style={{
                  fontFamily: 'Manrope_700Bold',
                  fontSize: 15,
                  color: '#FFFFFF',
                }}
              >
                {group.appName}
              </Text>

              {/* Red dot indicator for unread notifications */}
              {unreadCount > 0 ? (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#EF4444',
                    marginLeft: 2,
                  }}
                />
              ) : null}
            </View>

            <Text style={{ fontSize: 12, color: '#7C8494', marginTop: 1 }}>
              {formatNotisaveRelative(group.lastPostedAt, now)}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          {/* Bell Icon */}
          <Pressable
            hitSlop={8}
            onPress={() => onToggleMute?.(group)}
            style={({ pressed }) => [{ padding: 4, opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons
              name={isMuted ? 'notifications-off-outline' : 'notifications-outline'}
              size={19}
              color={isMuted ? '#EF4444' : '#7C8494'}
            />
          </Pressable>

          {/* 3-Dots Menu Icon */}
          <Pressable
            hitSlop={8}
            onPress={() => onOpenMenu(group)}
            style={({ pressed }) => [{ padding: 4, opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons name="ellipsis-vertical" size={18} color="#7C8494" />
          </Pressable>
        </View>
      </View>

      {/* 2. Notification Items inside this App Card (Grouped by conversation) */}
      <View style={{ gap: 10 }}>
        {groupedItems.map((entry, index) => {
          const item = entry.latestItem;
          const title = entry.title;
          const body = item.text ?? item.bigText ?? (item.mediaPath ? '📷 Photo' : '');
          const isUnread = entry.unreadCount > 0;
          const isGroup =
            isWhatsApp &&
            (title.includes('(B)') ||
              title.includes('-') ||
              title.includes('Personal') ||
              title.includes('Group') ||
              Boolean(item.groupKey));

          return (
            <Pressable
              key={`${entry.title}-${index}`}
              onPress={() => (onPressItem ? onPressItem(item) : onPress(group))}
              style={({ pressed }) => [{ gap: 2, opacity: pressed ? 0.75 : 1 }]}
            >
              {/* Line 1: Unread Dot + WhatsApp Group badge + Title + Message Count badge */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  {/* Red dot for unread notification item */}
                  {isUnread ? (
                    <View
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: 3.5,
                        backgroundColor: '#EF4444',
                      }}
                    />
                  ) : null}

                  {isGroup ? (
                    <View
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 2,
                        backgroundColor: '#9C27B0',
                      }}
                    />
                  ) : null}

                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 14.5,
                      fontFamily: isUnread ? 'Manrope_700Bold' : 'Manrope_600SemiBold',
                      color: isUnread ? '#FFFFFF' : '#9CA3AF',
                      flex: 1,
                    }}
                  >
                    {title}
                  </Text>
                </View>

                {/* Count badge showing total messages in this conversation if > 1 */}
                {entry.count > 1 ? (
                  <View
                    style={{
                      minWidth: 19,
                      height: 19,
                      borderRadius: 9.5,
                      backgroundColor: 'rgba(13, 148, 136, 0.15)',
                      borderWidth: 1,
                      borderColor: '#0D9488',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 4,
                    }}
                  >
                    <Text
                      style={{
                        color: '#0D9488',
                        fontFamily: 'Manrope_700Bold',
                        fontSize: 10.5,
                      }}
                    >
                      {entry.count}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Line 2: Latest message preview */}
              {body ? (
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 13.5,
                    color: entry.isDeleted
                      ? '#EF4444'
                      : isUnread
                      ? '#D1D5DB'
                      : '#6B7280',
                    paddingLeft: isUnread ? 13 : isGroup ? 18 : 0,
                  }}
                >
                  {entry.isDeleted ? `🗑️ [Deleted by sender] ${body}` : body}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </PressableBounce>
  );
}

export const AppNotificationCard = memo(AppNotificationCardBase);
