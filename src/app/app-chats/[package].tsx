import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  RefreshControl,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/AppIcon';
import { Avatar } from '@/components/Avatar';
import { PressableBounce } from '@/components/PressableBounce';
import { EmptyState, LoadingState } from '@/components/states';
import { Text } from '@/components/ui';
import { getConversations, queryNotifications, setArchived } from '@/data/repository';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { cleanChatTitle } from '@/lib/chat';
import type { Conversation, NotificationRecord } from '@/lib/types';
import { useDataVersion } from '@/store/dataVersion';
import { radius, space } from '@/theme';

function formatAppTime(timestamp: number): string {
  const d = new Date(timestamp);
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'pm' : 'am';
  h = h % 12;
  h = h ? h : 12;
  return `${ampm} ${h}:${m}`;
}

export default function AppChatsScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const { package: pkg, name } = useLocalSearchParams<{ package: string; name?: string }>();
  const bump = useDataVersion((s) => s.bump);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const appName = name || 'App';
  const packageName = pkg || 'com.whatsapp';
  const isWhatsApp = packageName.toLowerCase().includes('whatsapp');
  const isChatApp =
    isWhatsApp ||
    packageName.toLowerCase().includes('messaging') ||
    packageName.toLowerCase().includes('orca') ||
    packageName.toLowerCase().includes('telegram');

  const { data: allConversations, loading: convsLoading } = useLiveQuery(getConversations, []);
  const { data: allNotifications, loading: notifsLoading } = useLiveQuery(
    () => queryNotifications({ packages: [packageName], archived: 'include', limit: 300 }),
    [packageName],
  );

  // Mark all unread notifications for this app as read
  useEffect(() => {
    if (allNotifications && allNotifications.length > 0) {
      const unreadIds = allNotifications.filter((n) => !n.isArchived).map((n) => n.id);
      if (unreadIds.length > 0) {
        void setArchived(unreadIds, true).then(() => bump());
      }
    }
  }, [allNotifications]);

  const onRefresh = async () => {
    setRefreshing(true);
    bump();
    setRefreshing(false);
  };

  // Grouped conversations for this app (ensuring 1 row per contact/chat)
  const appConversations = useMemo(() => {
    // 1. Start with native SQLite conversations for this package
    const nativeList = (allConversations ?? []).filter((c) => c.packageName === packageName);
    const map = new Map<string, Conversation>();

    for (const c of nativeList) {
      const cleanTitle = cleanChatTitle(c.title) || appName;
      const existing = map.get(cleanTitle);
      if (!existing) {
        map.set(cleanTitle, {
          ...c,
          title: cleanTitle,
        });
      } else {
        existing.count += c.count;
        existing.deletedCount += c.deletedCount;
        existing.unreadCount = (existing.unreadCount ?? 0) + (c.unreadCount ?? 0);
        if (c.lastPostedAt > existing.lastPostedAt) {
          existing.lastPostedAt = c.lastPostedAt;
          existing.lastMessage = c.lastMessage;
          existing.mediaPath = c.mediaPath;
          existing.sbnKey = c.sbnKey;
        }
      }
    }

    // 2. Also ensure all notifications for this package are merged and grouped
    if (allNotifications && allNotifications.length > 0) {
      for (const n of allNotifications) {
        const cleanTitle = cleanChatTitle(n.title) || appName;
        const existing = map.get(cleanTitle);
        if (!existing) {
          map.set(cleanTitle, {
            packageName: n.packageName,
            appName: n.appName || appName,
            title: cleanTitle,
            lastMessage: n.text ?? n.bigText ?? (n.mediaPath ? '📷 Photo' : null),
            lastPostedAt: n.postedAt,
            count: 1,
            deletedCount: n.isDeleted ? 1 : 0,
            unreadCount: !n.isArchived ? 1 : 0,
            mediaPath: n.mediaPath,
            sbnKey: n.sbnKey,
          });
        }
      }
    }

    let list = Array.from(map.values()).sort((a, b) => b.lastPostedAt - a.lastPostedAt);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.lastMessage?.toLowerCase().includes(q) ?? false),
      );
    }
    return list;
  }, [allConversations, allNotifications, packageName, appName, search]);

  const hasConversations = appConversations.length > 0;

  const openThread = (c: Conversation) => {
    router.push({
      pathname: '/chat/thread' as any,
      params: {
        packageName: c.packageName,
        title: c.title,
        appName: c.appName,
      },
    });
  };

  const openNotificationDetail = (n: NotificationRecord) => {
    // Navigate to Details page (Image 2)
    router.push({
      pathname: '/chat/thread' as any,
      params: {
        packageName: n.packageName,
        title: n.title || appName,
        appName: n.appName || appName,
        notificationId: String(n.id),
      },
    });
  };

  const loading = convsLoading || notifsLoading;

  return (
    <SafeAreaView
      edges={[]}
      style={[
        { flex: 1, backgroundColor: '#232630' },
        {
          paddingTop: top,
          paddingBottom: bottom,
        },
      ]}
    >
      {/* 1. Header matching Screenshot 5: "← [AppIcon] AppName" on left, Search on right */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255,255,255,0.06)',
          backgroundColor: '#232630',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <PressableBounce hitSlop={10} onPress={() => router.back()} scaleTo={0.9}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </PressableBounce>

          <AppIcon packageName={packageName} name={appName} size={28} shape="squircle" />

          <Text
            style={{
              fontSize: 20,
              fontFamily: 'Manrope_800ExtraBold',
              color: '#FFFFFF',
            }}
          >
            {appName}
          </Text>
        </View>

        <PressableBounce
          scaleTo={0.9}
          hitSlop={10}
          onPress={() =>
            router.push({
              pathname: '/search' as any,
              params: { q: appName },
            })
          }
        >
          <Ionicons name="search" size={22} color="#FFFFFF" />
        </PressableBounce>
      </View>

      {/* 2. Search Bar if active */}
      {showSearch ? (
        <View style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#2A2E3B' }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#343846',
              borderRadius: radius.md,
              paddingHorizontal: space.md,
              height: 42,
              gap: space.sm,
            }}
          >
            <Ionicons name="search" size={18} color="#7C8494" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={`Search in ${appName}...`}
              placeholderTextColor="#7C8494"
              autoFocus
              style={{ flex: 1, fontSize: 14.5, color: '#FFFFFF' }}
            />
          </View>
        </View>
      ) : null}

      {/* 3. List Content matching Screenshot 5 (e.g. Gmail list) */}
      {loading ? (
        <LoadingState />
      ) : hasConversations ? (
        /* Conversation list */
        <FlatList
          data={appConversations}
          keyExtractor={(item) => `${item.packageName}:${item.title}`}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void onRefresh()}
              colors={['#0A6C74']}
              progressBackgroundColor="#2E323F"
            />
          }
          renderItem={({ item }) => (
            <PressableBounce
              onPress={() => openThread(item)}
              scaleTo={0.98}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(255,255,255,0.06)',
              }}
            >
              <Avatar
                name={item.title}
                packageName={item.packageName}
                appName={item.appName}
                size={48}
                showAppBadge={false}
              />

              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 3,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                    {isWhatsApp ? (
                      <View
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 2,
                          backgroundColor: '#9C27B0',
                        }}
                      />
                    ) : null}
                    {(item.unreadCount ?? 0) > 0 ? (
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: '#EF4444',
                        }}
                      />
                    ) : null}
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 15.5,
                        fontFamily: 'Manrope_700Bold',
                        color: '#FFFFFF',
                        flex: 1,
                      }}
                    >
                      {item.title}
                    </Text>
                  </View>

                  <Text style={{ fontSize: 12, color: '#7C8494', marginLeft: 8 }}>
                    {formatAppTime(item.lastPostedAt)}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 13.5,
                      color: '#9CA3AF',
                      flex: 1,
                    }}
                  >
                    {item.lastMessage ?? 'New message'}
                  </Text>

                  {/* Count badge showing total messages in this conversation */}
                  <View
                    style={{
                      minWidth: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 1.5,
                      borderColor: '#0D9488',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 5,
                    }}
                  >
                    <Text
                      style={{
                        color: '#0D9488',
                        fontFamily: 'Manrope_700Bold',
                        fontSize: 11,
                      }}
                    >
                      {item.count}
                    </Text>
                  </View>
                </View>
              </View>
            </PressableBounce>
          )}
        />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl }}>
          <EmptyState
            icon="chatbubbles-outline"
            title={`No ${appName} messages`}
            message={`New messages and notifications from ${appName} will automatically be logged here.`}
          />
        </View>
      )}
    </SafeAreaView>
  );
}
