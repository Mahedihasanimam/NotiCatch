import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  Share,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppGroup, AppNotificationCard } from '@/components/AppNotificationCard';
import { CrownIcon } from '@/components/CrownIcon';
import { PremiumModal } from '@/components/PremiumModal';
import { showAppConfirm, showAppToast } from '@/components/CustomDialog';
import { PressableBounce } from '@/components/PressableBounce';
import { EmptyState, LoadingState } from '@/components/states';
import { Text } from '@/components/ui';
import {
  deleteNotifications,
  openAccessSettings,
  openAppSettings,
  queryNotifications,
  setArchived,
} from '@/data/repository';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { formatTime } from '@/lib/time';
import type { NotificationRecord } from '@/lib/types';
import { useAccess } from '@/store/access';
import { useDataVersion } from '@/store/dataVersion';
import { useSettings } from '@/store/settings';
import { space } from '@/theme';

type SubTab = 'unread' | 'saved';
type FilterMode = 'all' | 'deleted';

async function fetchHomeData() {
  const [unreadNotifications, allNotifications, deletedMessages] =
    await Promise.all([
      queryNotifications({ archived: 'exclude', limit: 150 }),
      queryNotifications({ archived: 'include', limit: 200 }),
      queryNotifications({ deletedOnly: true, limit: 150 }),
    ]);
  return { unreadNotifications, allNotifications, deletedMessages };
}

export function NotificationsTab() {
  const { top } = useSafeAreaInsets();
  const bump = useDataVersion((s) => s.bump);
  const granted = useAccess((s) => s.granted);
  const toggleExcluded = useSettings((s) => s.toggleExcluded);

  const [subTab, setSubTab] = useState<SubTab>('saved');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [showPremium, setShowPremium] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 3-Dots Action Sheet state
  const [menuApp, setMenuApp] = useState<AppGroup | null>(null);
  const [mutedPackages, setMutedPackages] = useState<Record<string, boolean>>({});

  const { data, loading } = useLiveQuery(fetchHomeData, []);
  const now = Date.now();

  const onRefresh = async () => {
    setRefreshing(true);
    await useAccess.getState().refresh();
    bump();
    setRefreshing(false);
  };

  const unreadNotifications = data?.unreadNotifications ?? [];
  const allNotifications = data?.allNotifications ?? [];
  const deletedMessages = data?.deletedMessages ?? [];

  // Active dataset depending on Unread vs Saved
  const activeList = useMemo(() => {
    let source = subTab === 'unread' ? unreadNotifications : allNotifications;
    if (filterMode === 'deleted') {
      source = source.filter((n) => n.isDeleted);
    }
    return source;
  }, [subTab, unreadNotifications, allNotifications, filterMode]);

  // Group notifications by application into AppGroup cards
  const appGroups = useMemo<AppGroup[]>(() => {
    const map = new Map<string, AppGroup>();
    for (const n of activeList) {
      const pkg = n.packageName || 'unknown';
      const existing = map.get(pkg);
      if (!existing) {
        map.set(pkg, {
          packageName: pkg,
          appName: n.appName || 'App',
          lastPostedAt: n.postedAt,
          items: [n],
        });
      } else {
        existing.items.push(n);
        if (n.postedAt > existing.lastPostedAt) {
          existing.lastPostedAt = n.postedAt;
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => b.lastPostedAt - a.lastPostedAt);
  }, [activeList]);

  // Checkmark FAB action
  const handleMarkAllAsRead = () => {
    if (subTab === 'unread') {
      if (unreadNotifications.length === 0) {
        showAppToast('All notifications are already read');
        return;
      }

      showAppConfirm(
        'Mark all as read?',
        'Are you sure you want to mark all unread notifications as read?',
        async () => {
          try {
            const allUnread = await queryNotifications({
              archived: 'exclude',
              deletedOnly: filterMode === 'deleted',
              limit: 5000,
            });
            const ids = allUnread.map((n) => n.id);
            if (ids.length > 0) {
              await setArchived(ids, true);
              bump();
              showAppToast('All notifications marked as read');
            } else {
              showAppToast('All notifications are already read');
            }
          } catch {
            showAppToast('Could not mark as read', 'error');
          }
        },
        false,
        'Mark all read',
      );
    } else {
      if (allNotifications.length === 0) {
        showAppToast('No saved notifications to clear');
        return;
      }

      showAppConfirm(
        'Clear saved notifications?',
        'Are you sure you want to clear all saved notifications? This will delete them from your saved list.',
        async () => {
          try {
            const targetRecords = await queryNotifications({
              archived: 'include',
              deletedOnly: filterMode === 'deleted',
              limit: 5000,
            });
            const ids = targetRecords.map((n) => n.id);
            if (ids.length > 0) {
              await deleteNotifications(ids);
              bump();
              showAppToast(
                filterMode === 'deleted'
                  ? 'All deleted messages cleared'
                  : 'All saved notifications cleared',
              );
            } else {
              showAppToast('No saved notifications to clear');
            }
          } catch {
            showAppToast('Could not clear notifications', 'error');
          }
        },
        true,
        'Clear all',
      );
    }
  };

  // Navigate to App-wise message item list
  const handleOpenAppGroup = (group: AppGroup) => {
    router.push({
      pathname: '/app-chats/[package]' as any,
      params: { package: group.packageName, name: group.appName },
    });
  };

  // Navigate directly to Chat Thread or notification detail
  const handleOpenItem = (item: NotificationRecord, group: AppGroup) => {
    const isChatApp =
      group.packageName.toLowerCase().includes('whatsapp') ||
      group.packageName.toLowerCase().includes('messaging') ||
      group.packageName.toLowerCase().includes('orca') ||
      group.packageName.toLowerCase().includes('telegram');

    if (isChatApp && item.title) {
      router.push({
        pathname: '/chat/thread' as any,
        params: {
          packageName: group.packageName,
          title: item.title,
          appName: group.appName,
        },
      });
    } else {
      router.push({
        pathname: '/notification/[id]' as any,
        params: { id: String(item.id) },
      });
    }
  };

  // 3-Dots Action: Clear app notifications
  const handleClearAppNotifications = (group: AppGroup | null) => {
    if (!group) return;
    setMenuApp(null);
    showAppConfirm(
      `Clear ${group.appName} notifications?`,
      `Are you sure you want to delete all saved notifications from ${group.appName}?`,
      async () => {
        try {
          const appRecords = await queryNotifications({
            packages: [group.packageName],
            archived: 'include',
            limit: 2000,
          });
          const ids = appRecords.map((r) => r.id);
          if (ids.length > 0) {
            await deleteNotifications(ids);
            bump();
            showAppToast(`Cleared ${ids.length} notifications from ${group.appName}`);
          } else {
            showAppToast(`No notifications to clear for ${group.appName}`);
          }
        } catch {
          showAppToast('Could not clear notifications', 'error');
        }
      },
      true,
      'Clear',
    );
  };

  // 3-Dots Action: Do Not Save
  const handleDoNotSave = (group: AppGroup | null) => {
    if (!group) return;
    setMenuApp(null);
    showAppConfirm(
      `Do not save ${group.appName}?`,
      `Notifications from ${group.appName} will no longer be captured. You can re-enable this anytime in More > Block notifications.`,
      () => {
        toggleExcluded(group.packageName);
        bump();
        showAppToast(`${group.appName} notifications will not be saved`);
      },
      true,
      'Do not save',
    );
  };

  // 3-Dots Action: Export
  const handleExportApp = async (group: AppGroup | null) => {
    if (!group) return;
    setMenuApp(null);
    const content = group.items
      .map(
        (i) =>
          `[${formatTime(i.postedAt)}] ${i.title ?? group.appName}: ${i.text ?? i.bigText ?? ''}${
            i.isDeleted ? ' (DELETED BY SENDER)' : ''
          }`,
      )
      .join('\n');
    try {
      await Share.share({
        title: `${group.appName} Notifications Export`,
        message: `${group.appName} Saved Notifications:\n\n${content}`,
      });
    } catch {}
  };

  // Bell toggle
  const handleToggleMute = (group: AppGroup) => {
    setMutedPackages((prev) => {
      const nextMuted = !prev[group.packageName];
      showAppToast(
        nextMuted
          ? `Alerts muted for ${group.appName}`
          : `Alerts unmuted for ${group.appName}`,
      );
      return { ...prev, [group.packageName]: nextMuted };
    });
  };

  return (
    <SafeAreaView
      edges={[]}
      style={[
        { flex: 1, backgroundColor: '#232630' },
        {
          paddingTop: top,
        },
      ]}
    >
      {/* 1. Top Header: ("Unread   Saved" + 👑 + 🔍) */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: 14,
          paddingBottom: 14,
          backgroundColor: '#232630',
        }}
      >
        {/* Unread / Saved Toggle */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
          <PressableBounce onPress={() => setSubTab('unread')} scaleTo={0.94}>
            <Text
              style={{
                fontSize: 22,
                fontFamily: 'Manrope_800ExtraBold',
                color: subTab === 'unread' ? '#FFFFFF' : '#8E94A5',
                letterSpacing: -0.3,
              }}
            >
              Unread
            </Text>
          </PressableBounce>

          <PressableBounce onPress={() => setSubTab('saved')} scaleTo={0.94}>
            <Text
              style={{
                fontSize: 22,
                fontFamily: 'Manrope_800ExtraBold',
                color: subTab === 'saved' ? '#FFFFFF' : '#8E94A5',
                letterSpacing: -0.3,
              }}
            >
              Saved
            </Text>
          </PressableBounce>
        </View>

        {/* Right side: Gold Crown (VIP) + Search */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <CrownIcon
            size={24}
            color="#FFC107"
            onPress={() => setShowPremium(true)}
          />

          <PressableBounce
            scaleTo={0.88}
            hitSlop={12}
            onPress={() => router.push('/search' as any)}
          >
            <Ionicons name="search" size={23} color="#FFFFFF" />
          </PressableBounce>
        </View>
      </View>

      {/* 2. Notification Access Disabled Warning (only if NOT granted) */}
      {!granted ? (
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 12,
            backgroundColor: '#352912',
            borderWidth: 1,
            borderColor: '#F59E0B',
            borderRadius: 14,
            padding: 14,
            gap: 10,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="warning" size={20} color="#F59E0B" />
            <Text style={{ color: '#F59E0B', fontFamily: 'Manrope_700Bold', fontSize: 14 }}>
              Notification Access Disabled
            </Text>
          </View>
          <Text style={{ color: '#D1D5DB', fontSize: 12.5, lineHeight: 18 }}>
            NotiCatch needs notification access to capture incoming messages. If the switch in Settings is greyed out, tap "Allow Restricted Settings" below first.
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <PressableBounce
              onPress={() => void openAccessSettings()}
              style={{
                flex: 1,
                backgroundColor: '#F59E0B',
                paddingVertical: 9,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#1F1604', fontFamily: 'Manrope_700Bold', fontSize: 13 }}>
                Enable Access
              </Text>
            </PressableBounce>
            <PressableBounce
              onPress={() => void openAppSettings()}
              style={{
                flex: 1,
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                borderWidth: 1,
                borderColor: '#F59E0B',
                paddingVertical: 9,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#F59E0B', fontFamily: 'Manrope_700Bold', fontSize: 13 }}>
                Allow Restricted
              </Text>
            </PressableBounce>
          </View>
        </View>
      ) : null}

      {/* 3. Main Notifications Feed */}
      <View style={{ flex: 1, position: 'relative' }}>
        {loading ? (
          <LoadingState />
        ) : appGroups.length === 0 ? (
          <View style={{ padding: space.xl, flex: 1, justifyContent: 'center' }}>
            <EmptyState
              icon={filterMode === 'deleted' ? 'trash-outline' : 'notifications-outline'}
              title={
                filterMode === 'deleted'
                  ? 'No deleted messages'
                  : subTab === 'unread'
                  ? 'No unread notifications'
                  : 'No saved notifications'
              }
              message={
                filterMode === 'deleted'
                  ? 'Messages that senders delete from WhatsApp, Messenger, or Telegram will appear here.'
                  : subTab === 'unread'
                  ? 'All caught up! New incoming notifications will appear here.'
                  : 'Captured notifications will be organized by app and preserved here.'
              }
            />
          </View>
        ) : (
          <FlatList
            data={appGroups}
            keyExtractor={(item) => item.packageName}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 4,
              paddingBottom: 85,
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => void onRefresh()}
                colors={['#0A6C74']}
                progressBackgroundColor="#2E323F"
              />
            }
            renderItem={({ item: group }) => (
              <AppNotificationCard
                group={group}
                now={now}
                onPress={handleOpenAppGroup}
                onPressItem={() => handleOpenAppGroup(group)}
                onOpenMenu={(g) => setMenuApp(g)}
                isMuted={Boolean(mutedPackages[group.packageName])}
                onToggleMute={handleToggleMute}
              />
            )}
          />
        )}

        {/* 4. Floating Action Button (White circular checkmark FAB) */}
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            zIndex: 99999,
            elevation: 24,
          }}
        >
          <PressableBounce
            onPress={handleMarkAllAsRead}
            accessibilityRole="button"
            accessibilityLabel={subTab === 'unread' ? 'Mark all as read' : 'Clear all saved'}
            scaleTo={0.9}
            style={{
              width: 58,
              height: 58,
              borderRadius: 29,
              backgroundColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius: 6,
              elevation: 20,
            }}
          >
            <Ionicons name="checkmark" size={30} color="#20232C" />
          </PressableBounce>
        </View>
      </View>

      {/* 5. 3-Dots Action Sheet Modal */}
      <Modal
        visible={menuApp !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuApp(null)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'flex-end',
          }}
          onPress={() => setMenuApp(null)}
        >
          <Pressable
            style={{
              backgroundColor: '#2E323F',
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              paddingTop: 14,
              paddingBottom: Platform.OS === 'ios' ? 36 : 22,
              paddingHorizontal: 20,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Clear notifications for this app */}
            <PressableBounce
              onPress={() => handleClearAppNotifications(menuApp)}
              scaleTo={0.96}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 16,
                paddingVertical: 14,
              }}
            >
              <Ionicons name="trash-outline" size={24} color="#EF4444" />
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'Manrope_600SemiBold',
                  color: '#EF4444',
                }}
              >
                Clear notifications
              </Text>
            </PressableBounce>

            {/* Do not save */}
            <PressableBounce
              onPress={() => handleDoNotSave(menuApp)}
              scaleTo={0.96}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 16,
                paddingVertical: 14,
              }}
            >
              <Ionicons name="ban-outline" size={24} color="#FFFFFF" />
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'Manrope_600SemiBold',
                  color: '#FFFFFF',
                }}
              >
                Do not save
              </Text>
            </PressableBounce>

            {/* Export */}
            <PressableBounce
              onPress={() => void handleExportApp(menuApp)}
              scaleTo={0.96}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 16,
                paddingVertical: 14,
              }}
            >
              <Ionicons name="download-outline" size={24} color="#FFFFFF" />
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'Manrope_600SemiBold',
                  color: '#FFFFFF',
                }}
              >
                Export
              </Text>
            </PressableBounce>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 6. Premium Modal */}
      <PremiumModal visible={showPremium} onClose={() => setShowPremium(false)} />
    </SafeAreaView>
  );
}

