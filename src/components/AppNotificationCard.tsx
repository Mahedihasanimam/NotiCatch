import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, View } from 'react-native';
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
      {/* 1. Header Row matching Screenshot 1: App Icon + Name + Timestamp + Bell + 3-dots */}
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
            <Text
              style={{
                fontFamily: 'Manrope_700Bold',
                fontSize: 15,
                color: '#FFFFFF',
              }}
            >
              {group.appName}
            </Text>
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

      {/* 2. Notification Items inside this App Card matching Screenshot 1 */}
      <View style={{ gap: 10 }}>
        {group.items.map((item, index) => {
          const title = item.title ?? group.appName;
          const body = item.text ?? item.bigText ?? '';
          const isGroup =
            isWhatsApp &&
            (title.includes('(B)') ||
              title.includes('-') ||
              title.includes('Personal') ||
              title.includes('Group') ||
              Boolean(item.groupKey));

          return (
            <Pressable
              key={`${item.id}-${index}`}
              onPress={() => (onPressItem ? onPressItem(item) : onPress(group))}
              style={({ pressed }) => [{ gap: 2, opacity: pressed ? 0.75 : 1 }]}
            >
              {/* Line 1: Title (with purple square badge if WhatsApp group chat, matching Screenshot 1) */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
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
                    fontFamily: 'Manrope_700Bold',
                    color: '#FFFFFF',
                    flex: 1,
                  }}
                >
                  {title}
                </Text>
              </View>

              {/* Line 2: Message preview */}
              {body ? (
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 13.5,
                    color: item.isDeleted ? '#EF4444' : '#D1D5DB',
                    paddingLeft: isGroup ? 18 : 0,
                  }}
                >
                  {item.isDeleted ? `🗑️ [Deleted by sender] ${body}` : body}
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
