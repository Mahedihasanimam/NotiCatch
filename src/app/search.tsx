import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/AppIcon';
import { Avatar } from '@/components/Avatar';
import { PressableBounce } from '@/components/PressableBounce';
import { EmptyState, LoadingState } from '@/components/states';
import { Text } from '@/components/ui';
import { getConversations, queryNotifications } from '@/data/repository';
import KV from 'expo-sqlite/kv-store';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { formatNotisaveRelative } from '@/lib/time';
import type { Conversation, NotificationRecord } from '@/lib/types';
import { radius, space } from '@/theme';

type SearchCategory = 'all' | 'chats' | 'notifications' | 'deleted';

const RECENT_SEARCHES_KEY = 'noticatch_recent_searches';

function loadRecentSearches(): string[] {
  try {
    const raw = KV.getItemSync(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentSearches(list: string[]) {
  try {
    KV.setItemSync(RECENT_SEARCHES_KEY, JSON.stringify(list));
  } catch {}
}

function formatSearchTime(timestamp: number): string {
  const d = new Date(timestamp);
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'pm' : 'am';
  h = h % 12;
  h = h ? h : 12;
  return `${ampm} ${h}:${m}`;
}

export default function GlobalSearchScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const params = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(params.q || '');
  const [category, setCategory] = useState<SearchCategory>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>(() => loadRecentSearches());
  const inputRef = useRef<any>(null);

  const addRecentSearch = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
      const next = [trimmed, ...filtered].slice(0, 8);
      saveRecentSearches(next);
      return next;
    });
  };

  const removeRecentSearch = (item: string) => {
    setRecentSearches((prev) => {
      const next = prev.filter((s) => s !== item);
      saveRecentSearches(next);
      return next;
    });
  };

  const clearAllRecentSearches = () => {
    setRecentSearches([]);
    saveRecentSearches([]);
  };

  useEffect(() => {
    if (params.q) {
      setQuery(params.q);
    }
  }, [params.q]);

  // Query all notifications from database
  const { data: allRecords, loading: recordsLoading } = useLiveQuery(
    () => queryNotifications({ archived: 'include', limit: 300 }),
    [],
  );

  // Query all conversations
  const { data: allConversations, loading: convsLoading } = useLiveQuery(
    getConversations,
    [],
  );

  const loading = recordsLoading || convsLoading;

  // Dynamic top apps computed from actual captured notifications
  const dynamicTopApps = useMemo(() => {
    if (!allRecords || allRecords.length === 0) return [];
    const appMap = new Map<string, { appName: string; packageName: string; count: number }>();
    for (const r of allRecords) {
      const key = r.packageName;
      const existing = appMap.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        appMap.set(key, {
          appName: r.appName || 'App',
          packageName: r.packageName,
          count: 1,
        });
      }
    }
    return Array.from(appMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [allRecords]);

  // Dynamic count of deleted notifications
  const deletedCount = useMemo(() => {
    return (allRecords ?? []).filter((r) => r.isDeleted).length;
  }, [allRecords]);

  // Top recent conversations
  const topSenders = useMemo(() => {
    return (allConversations ?? []).slice(0, 6);
  }, [allConversations]);

  // Filtered Conversations matching query
  const filteredConversations = useMemo<Conversation[]>(() => {
    const list = allConversations ?? [];
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return list.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.lastMessage?.toLowerCase().includes(q) ?? false) ||
        c.appName.toLowerCase().includes(q) ||
        c.packageName.toLowerCase().includes(q),
    );
  }, [allConversations, query]);

  // Filtered Notifications matching query (or category)
  const filteredNotifications = useMemo<NotificationRecord[]>(() => {
    const list = allRecords ?? [];
    if (category === 'deleted') {
      const deletedList = list.filter((n) => n.isDeleted);
      if (!query.trim()) return deletedList;
      const q = query.trim().toLowerCase();
      return deletedList.filter(
        (n) =>
          (n.title?.toLowerCase().includes(q) ?? false) ||
          (n.text?.toLowerCase().includes(q) ?? false) ||
          (n.bigText?.toLowerCase().includes(q) ?? false) ||
          (n.appName?.toLowerCase().includes(q) ?? false) ||
          (n.packageName?.toLowerCase().includes(q) ?? false),
      );
    }

    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return list.filter(
      (n) =>
        (n.title?.toLowerCase().includes(q) ?? false) ||
        (n.text?.toLowerCase().includes(q) ?? false) ||
        (n.bigText?.toLowerCase().includes(q) ?? false) ||
        (n.appName?.toLowerCase().includes(q) ?? false) ||
        (n.packageName?.toLowerCase().includes(q) ?? false),
    );
  }, [allRecords, query, category]);

  const openThread = (c: Conversation) => {
    Keyboard.dismiss();
    if (query.trim()) addRecentSearch(query);
    router.push({
      pathname: '/chat/thread' as any,
      params: {
        packageName: c.packageName,
        title: c.title,
        appName: c.appName,
      },
    });
  };

  const openNotification = (n: NotificationRecord) => {
    Keyboard.dismiss();
    if (query.trim()) addRecentSearch(query);
    const isChat =
      n.packageName.toLowerCase().includes('whatsapp') ||
      n.packageName.toLowerCase().includes('messaging') ||
      n.packageName.toLowerCase().includes('orca') ||
      n.packageName.toLowerCase().includes('telegram');

    if (isChat && n.title) {
      router.push({
        pathname: '/chat/thread' as any,
        params: {
          packageName: n.packageName,
          title: n.title,
          appName: n.appName,
        },
      });
    } else {
      router.push({
        pathname: '/notification/[id]' as any,
        params: { id: String(n.id) },
      });
    }
  };

  const isViewingDeleted = category === 'deleted';
  const isSearching = Boolean(query.trim()) || isViewingDeleted;

  const hasResults =
    (category === 'all' && (filteredConversations.length > 0 || filteredNotifications.length > 0)) ||
    (category === 'chats' && filteredConversations.length > 0) ||
    (category === 'notifications' && filteredNotifications.length > 0) ||
    (category === 'deleted' && filteredNotifications.length > 0);

  const totalResultsCount =
    category === 'all'
      ? filteredConversations.length + filteredNotifications.length
      : category === 'chats'
      ? filteredConversations.length
      : filteredNotifications.length;

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
      {/* 1. Header with Search Input */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 10,
          backgroundColor: '#232630',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255,255,255,0.06)',
        }}
      >
        <PressableBounce hitSlop={12} onPress={() => router.back()} scaleTo={0.9}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </PressableBounce>

        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#2E323F',
            borderRadius: radius.pill,
            paddingHorizontal: 14,
            height: 44,
            gap: 10,
          }}
        >
          <Ionicons name="search" size={19} color="#7C8494" />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => {
              if (query.trim()) addRecentSearch(query);
            }}
            placeholder="Search all messages, apps, senders..."
            placeholderTextColor="#7C8494"
            autoFocus
            returnKeyType="search"
            style={{
              flex: 1,
              fontSize: 15,
              color: '#FFFFFF',
              fontFamily: 'Manrope_500Medium',
            }}
          />
          {query.length > 0 ? (
            <Pressable
              hitSlop={8}
              onPress={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
            >
              <Ionicons name="close-circle" size={18} color="#7C8494" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* 2. Filter Category Pills */}
      <View style={{ paddingVertical: 10 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {(
            [
              { key: 'all', label: 'All' },
              { key: 'chats', label: 'Chats & Messages' },
              { key: 'notifications', label: 'Notifications' },
              { key: 'deleted', label: 'Deleted Only' },
            ] as const
          ).map((cat) => {
            const active = category === cat.key;
            return (
              <PressableBounce
                key={cat.key}
                onPress={() => setCategory(cat.key)}
                scaleTo={0.94}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: radius.pill,
                  backgroundColor: active ? '#0A6C74' : '#2E323F',
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: active ? 'Manrope_700Bold' : 'Manrope_500Medium',
                    color: active ? '#FFFFFF' : '#9CA3AF',
                  }}
                >
                  {cat.label}
                </Text>
              </PressableBounce>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Main Content: Suggestions OR Results */}
      {loading ? (
        <LoadingState />
      ) : !isSearching ? (
        /* Empty State with Dynamic Quick Suggestions */
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Section A: Recent Searches (if user searched previously) */}
          {recentSearches.length > 0 ? (
            <View style={{ marginBottom: 24 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                }}
              >
                <Text
                  style={{
                    fontSize: 12.5,
                    fontFamily: 'Manrope_700Bold',
                    color: '#7C8494',
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                  }}
                >
                  Recent Searches
                </Text>
                <PressableBounce hitSlop={8} onPress={clearAllRecentSearches}>
                  <Text style={{ fontSize: 12, color: '#0D9488', fontFamily: 'Manrope_600SemiBold' }}>
                    Clear all
                  </Text>
                </PressableBounce>
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {recentSearches.map((s) => (
                  <View
                    key={s}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#2E323F',
                      borderRadius: 10,
                      paddingLeft: 10,
                      paddingRight: 6,
                      paddingVertical: 6,
                      gap: 6,
                      borderWidth: 1,
                      borderColor: 'rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <PressableBounce
                      onPress={() => {
                        setQuery(s);
                        setCategory('all');
                      }}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                    >
                      <Ionicons name="time-outline" size={14} color="#7C8494" />
                      <Text style={{ fontSize: 13.5, color: '#FFFFFF', fontFamily: 'Manrope_600SemiBold' }}>
                        {s}
                      </Text>
                    </PressableBounce>
                    <PressableBounce hitSlop={6} onPress={() => removeRecentSearch(s)}>
                      <Ionicons name="close" size={16} color="#7C8494" />
                    </PressableBounce>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Section B: Quick Filters & Real Active Apps */}
          <View style={{ marginBottom: 26 }}>
            <Text
              style={{
                fontSize: 12.5,
                fontFamily: 'Manrope_700Bold',
                color: '#7C8494',
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                marginBottom: 12,
              }}
            >
              Quick Searches
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {/* Deleted Messages Quick Filter (dynamic badge count) */}
              <PressableBounce
                onPress={() => {
                  setCategory('deleted');
                  setQuery('');
                }}
                scaleTo={0.95}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  borderWidth: 1,
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 10,
                }}
              >
                <Ionicons name="trash-outline" size={15} color="#EF4444" />
                <Text style={{ fontSize: 13.5, fontFamily: 'Manrope_700Bold', color: '#EF4444' }}>
                  Deleted Messages
                </Text>
                {deletedCount > 0 ? (
                  <View
                    style={{
                      backgroundColor: '#EF4444',
                      borderRadius: 10,
                      paddingHorizontal: 6,
                      paddingVertical: 1,
                    }}
                  >
                    <Text style={{ fontSize: 10.5, color: '#FFFFFF', fontFamily: 'Manrope_800ExtraBold' }}>
                      {deletedCount}
                    </Text>
                  </View>
                ) : null}
              </PressableBounce>

              {/* Dynamic Apps from Actual Captured Notifications */}
              {dynamicTopApps.map((app) => (
                <PressableBounce
                  key={app.packageName}
                  onPress={() => {
                    setQuery(app.appName);
                    setCategory('all');
                    addRecentSearch(app.appName);
                  }}
                  scaleTo={0.95}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    backgroundColor: '#2E323F',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.06)',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 10,
                  }}
                >
                  <AppIcon packageName={app.packageName} name={app.appName} size={18} shape="squircle" />
                  <Text style={{ fontSize: 13.5, fontFamily: 'Manrope_600SemiBold', color: '#FFFFFF' }}>
                    {app.appName}
                  </Text>
                  <Text style={{ fontSize: 11.5, color: '#7C8494', fontFamily: 'Manrope_600SemiBold' }}>
                    {app.count}
                  </Text>
                </PressableBounce>
              ))}

              {/* Dynamic Top Senders / Contacts */}
              {topSenders.map((conv) => (
                <PressableBounce
                  key={`${conv.packageName}:${conv.title}`}
                  onPress={() => {
                    setQuery(conv.title);
                    setCategory('chats');
                    addRecentSearch(conv.title);
                  }}
                  scaleTo={0.95}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    backgroundColor: '#2E323F',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.06)',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 10,
                  }}
                >
                  <Avatar
                    name={conv.title}
                    packageName={conv.packageName}
                    appName={conv.appName}
                    imageUri={
                      conv.mediaPath
                        ? conv.mediaPath.startsWith('file://')
                          ? conv.mediaPath
                          : `file://${conv.mediaPath}`
                        : undefined
                    }
                    size={20}
                    showAppBadge={false}
                  />
                  <Text style={{ fontSize: 13.5, fontFamily: 'Manrope_600SemiBold', color: '#FFFFFF' }}>
                    {conv.title}
                  </Text>
                </PressableBounce>
              ))}
            </View>
          </View>

          {/* Recent captured preview */}
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'Manrope_700Bold',
              color: '#7C8494',
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              marginBottom: 12,
            }}
          >
            Recent Notifications ({(allRecords ?? []).length})
          </Text>

          <View style={{ gap: 10 }}>
            {(allRecords ?? []).slice(0, 5).map((rec) => (
              <PressableBounce
                key={rec.id}
                onPress={() => openNotification(rec)}
                scaleTo={0.98}
                style={{
                  backgroundColor: '#2E323F',
                  borderRadius: 14,
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <AppIcon
                  packageName={rec.packageName}
                  name={rec.appName}
                  size={36}
                  shape="squircle"
                />
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 2,
                    }}
                  >
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 14,
                        fontFamily: 'Manrope_700Bold',
                        color: '#FFFFFF',
                        flex: 1,
                        marginRight: 8,
                      }}
                    >
                      {rec.title ?? rec.appName}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#7C8494' }}>
                      {formatNotisaveRelative(rec.postedAt)}
                    </Text>
                  </View>
                  <Text numberOfLines={1} style={{ fontSize: 13, color: '#9CA3AF' }}>
                    {rec.text || rec.bigText || 'No message text'}
                  </Text>
                </View>
              </PressableBounce>
            ))}
          </View>
        </ScrollView>
      ) : !hasResults ? (
        /* No Results Found */
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl }}>
          <EmptyState
            icon="search-outline"
            title="No matches found"
            message={`No messages or notifications matching "${query}" were found.`}
          />
        </View>
      ) : (
        /* Search Results List */
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Result Count Info */}
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'Manrope_600SemiBold',
              color: '#7C8494',
              marginBottom: 14,
            }}
          >
            Found {totalResultsCount} result{totalResultsCount === 1 ? '' : 's'}
          </Text>

          {/* Section 1: Chat Conversations */}
          {(category === 'all' || category === 'chats') && filteredConversations.length > 0 ? (
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Manrope_700Bold',
                  color: '#7C8494',
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  marginBottom: 10,
                }}
              >
                Chats & Senders ({filteredConversations.length})
              </Text>

              <View style={{ backgroundColor: '#2E323F', borderRadius: 16, overflow: 'hidden' }}>
                {filteredConversations.map((item, idx) => {
                  const isLast = idx === filteredConversations.length - 1;
                  const isGroup =
                    item.title.includes('(B)') ||
                    item.title.toLowerCase().includes('group') ||
                    item.packageName.toLowerCase().includes('whatsapp');

                  return (
                    <PressableBounce
                      key={`${item.packageName}:${item.title}`}
                      onPress={() => openThread(item)}
                      scaleTo={0.98}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        padding: 14,
                        borderBottomWidth: isLast ? 0 : 1,
                        borderBottomColor: 'rgba(255,255,255,0.06)',
                      }}
                    >
                      <Avatar
                        name={item.title}
                        packageName={item.packageName}
                        appName={item.appName}
                        imageUri={
                          item.avatarPath
                            ? item.avatarPath.startsWith('file://')
                              ? item.avatarPath
                              : `file://${item.avatarPath}`
                            : item.mediaPath
                              ? item.mediaPath.startsWith('file://')
                                ? item.mediaPath
                                : `file://${item.mediaPath}`
                              : undefined
                        }
                        size={44}
                        showAppBadge
                      />

                      <View style={{ flex: 1 }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 2,
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                            {isGroup && item.packageName.toLowerCase().includes('whatsapp') ? (
                              <View
                                style={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: 2,
                                  backgroundColor: '#9C27B0',
                                }}
                              />
                            ) : null}
                            <Text
                              numberOfLines={1}
                              style={{
                                fontSize: 15,
                                fontFamily: 'Manrope_700Bold',
                                color: '#FFFFFF',
                                flex: 1,
                              }}
                            >
                              {item.title}
                            </Text>
                          </View>
                          <Text style={{ fontSize: 11, color: '#7C8494', marginLeft: 8 }}>
                            {formatSearchTime(item.lastPostedAt)}
                          </Text>
                        </View>

                        <Text numberOfLines={1} style={{ fontSize: 13, color: '#9CA3AF' }}>
                          {item.lastMessage ?? 'Conversation'}
                        </Text>
                      </View>
                    </PressableBounce>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* Section 2: Notifications */}
          {(category === 'all' || category === 'notifications' || category === 'deleted') &&
          filteredNotifications.length > 0 ? (
            <View>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Manrope_700Bold',
                  color: '#7C8494',
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  marginBottom: 10,
                }}
              >
                Notifications ({filteredNotifications.length})
              </Text>

              <View style={{ gap: 10 }}>
                {filteredNotifications.map((item) => (
                  <PressableBounce
                    key={item.id}
                    onPress={() => openNotification(item)}
                    scaleTo={0.98}
                    style={{
                      backgroundColor: '#2E323F',
                      borderRadius: 14,
                      padding: 14,
                    }}
                  >
                    {/* Header Row */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 6,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <AppIcon
                          packageName={item.packageName}
                          name={item.appName}
                          size={24}
                          shape="squircle"
                        />
                        <Text
                          style={{
                            fontSize: 13,
                            fontFamily: 'Manrope_700Bold',
                            color: '#9CA3AF',
                          }}
                        >
                          {item.appName}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 11, color: '#7C8494' }}>
                        {formatNotisaveRelative(item.postedAt)}
                      </Text>
                    </View>

                    {/* Content */}
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 14.5,
                        fontFamily: 'Manrope_700Bold',
                        color: '#FFFFFF',
                        marginBottom: 3,
                      }}
                    >
                      {item.title ?? item.appName}
                    </Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      {item.isDeleted ? (
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
                          <Ionicons name="trash" size={10} color="#EF4444" />
                          <Text
                            style={{
                              fontSize: 11,
                              color: '#EF4444',
                              fontFamily: 'Manrope_700Bold',
                            }}
                          >
                            Deleted
                          </Text>
                        </View>
                      ) : null}

                      <Text
                        numberOfLines={2}
                        style={{
                          fontSize: 13,
                          color: item.isDeleted ? '#FCA5A5' : '#D1D5DB',
                          flex: 1,
                        }}
                      >
                        {item.text || item.bigText || 'No message text'}
                      </Text>
                    </View>
                  </PressableBounce>
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
