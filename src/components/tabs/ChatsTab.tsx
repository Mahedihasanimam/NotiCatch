import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '@/components/Avatar';
import { CrownIcon } from '@/components/CrownIcon';
import { PremiumModal } from '@/components/PremiumModal';
import { showAppConfirm, showAppToast } from '@/components/CustomDialog';
import { PressableBounce } from '@/components/PressableBounce';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { Text } from '@/components/ui';
import { deleteNotifications, getConversations, openAccessSettings, queryNotifications, setArchived } from '@/data/repository';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { isChatMessage } from '@/lib/chat';
import type { Conversation } from '@/lib/types';
import { useAccess } from '@/store/access';
import { useDataVersion } from '@/store/dataVersion';
import { useSettings } from '@/store/settings';
import { space } from '@/theme';

function formatChatListTime(timestamp: number): string {
  const d = new Date(timestamp);
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'pm' : 'am';
  h = h % 12;
  h = h ? h : 12;
  return `${ampm} ${h}:${m}`;
}

export function ChatsTab() {
  const { top } = useSafeAreaInsets();
  const bump = useDataVersion((s) => s.bump);
  const granted = useAccess((s) => s.granted);
  const isPro = useSettings((s) => s.isPro);
  const [refreshing, setRefreshing] = useState(false);
  const [showPremium, setShowPremium] = useState(false);

  const { data: conversations, loading, error, reload } = useLiveQuery(getConversations, []);

  const onRefresh = async () => {
    setRefreshing(true);
    bump();
    setRefreshing(false);
  };

  const list = conversations ?? [];

  const openThread = async (c: Conversation) => {
    try {
      const msgs = await queryNotifications({
        packages: [c.packageName],
        search: c.title,
        archived: 'exclude',
        limit: 100,
      });
      if (msgs.length > 0) {
        await setArchived(msgs.map((m) => m.id), true);
        bump();
      }
    } catch {}

    router.push({
      pathname: '/chat/thread' as any,
      params: {
        packageName: c.packageName,
        title: c.title,
        appName: c.appName,
      },
    });
  };

  // Checkmark FAB Action: prompts in custom modal to clear all messages
  const handleClearAllMessages = () => {
    showAppConfirm(
      'Clear all messages?',
      'Are you sure you want to clear all chat messages? Notifications from other apps will not be affected.',
      async () => {
        try {
          const allRecords = await queryNotifications({ archived: 'include', limit: 3000 });
          const messageIds = allRecords.filter(isChatMessage).map((n) => n.id);
          if (messageIds.length > 0) {
            await deleteNotifications(messageIds);
            bump();
            showAppToast('All chat messages cleared');
          } else {
            showAppToast('No chat messages to clear');
          }
        } catch {
          showAppToast('Could not clear messages', 'error');
        }
      },
      true,
      'Clear all',
    );
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
      {/* 1. Header: "Messages" on left, Crown + Search on right */}
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
        <Text
          style={{
            fontSize: 24,
            fontFamily: 'Manrope_800ExtraBold',
            color: '#FFFFFF',
            letterSpacing: -0.3,
          }}
        >
          Messages
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <CrownIcon
            size={24}
            color={isPro ? '#2DD4BF' : '#FFC107'}
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

      {/* 2. Messages List */}
      <View style={{ flex: 1, position: 'relative' }}>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : list.length === 0 ? (
          <View style={{ padding: space.xl, flex: 1, justifyContent: 'center' }}>
            <EmptyState
              icon="chatbubbles-outline"
              title="No messages yet"
              message={
                granted
                  ? 'Incoming WhatsApp, Messenger, Teams, or Messages will appear here. Deleted messages are preserved automatically!'
                  : 'Notification access is currently disabled. Enable access to automatically save chat messages.'
              }
              actionLabel={!granted ? 'Enable Access' : undefined}
              onAction={!granted ? () => void openAccessSettings() : undefined}
            />
          </View>
        ) : (
          <FlatList
            data={list}
            keyExtractor={(item) => `${item.packageName}:${item.title}`}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 2,
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
            renderItem={({ item }) => {
              const isGroup =
                item.title.includes('(B)') ||
                item.title.toLowerCase().includes('group') ||
                item.packageName.toLowerCase().includes('whatsapp');
              const isDeleted = item.deletedCount > 0;

              return (
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
                    imageUri={
                      item.mediaPath
                        ? item.mediaPath.startsWith('file://')
                          ? item.mediaPath
                          : `file://${item.mediaPath}`
                        : undefined
                    }
                    size={48}
                    showAppBadge={true}
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
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: 8 }}>
                        {isGroup && item.packageName.toLowerCase().includes('whatsapp') ? (
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
                          style={{
                            fontSize: 16,
                            fontFamily: 'Manrope_700Bold',
                            color: '#FFFFFF',
                            flex: 1,
                          }}
                          numberOfLines={1}
                        >
                          {item.title}
                        </Text>
                      </View>

                      <Text style={{ fontSize: 12, color: '#7C8494' }}>
                        {formatChatListTime(item.lastPostedAt)}
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
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 4 }}>
                        {isDeleted ? (
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 3,
                              backgroundColor: 'rgba(239,68,68,0.15)',
                              paddingHorizontal: 4,
                              paddingVertical: 2,
                              borderRadius: 4,
                            }}
                          >
                            <View
                              style={{
                                width: 5,
                                height: 5,
                                borderRadius: 2.5,
                                backgroundColor: '#EF4444',
                              }}
                            />
                            <Ionicons name="trash" size={10} color="#EF4444" />
                          </View>
                        ) : null}

                        {item.title.includes('Srj') ? (
                          <Ionicons name="person" size={12} color="#1877F2" />
                        ) : null}

                        <Text
                          numberOfLines={1}
                          style={{
                            flex: 1,
                            fontSize: 13.5,
                            color: isDeleted ? '#FCA5A5' : '#9CA3AF',
                          }}
                        >
                          {item.lastMessage ?? (item.mediaPath ? '📷 Photo' : 'New message')}
                        </Text>
                      </View>

                      {/* Count badge showing total messages in this conversation if > 1 */}
                      {item.count > 1 ? (
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
                            marginLeft: 6,
                          }}
                        >
                          <Text
                            style={{
                              color: '#0D9488',
                              fontFamily: 'Manrope_700Bold',
                              fontSize: 10.5,
                            }}
                          >
                            {item.count}
                          </Text>
                        </View>
                      ) : null}

                      {/* Red dot indicator for unread chat conversation */}
                      {(item.unreadCount ?? 0) > 0 ? (
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: '#EF4444',
                            marginLeft: 6,
                          }}
                        />
                      ) : null}
                    </View>
                  </View>
                </PressableBounce>
              );
            }}
          />
        )}

        {/* 3. White checkmark FAB at bottom-right */}
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
            onPress={handleClearAllMessages}
            accessibilityRole="button"
            accessibilityLabel="Clear all messages"
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

      {/* Premium Screen Modal */}
      <PremiumModal visible={showPremium} onClose={() => setShowPremium(false)} />
    </SafeAreaView>
  );
}

