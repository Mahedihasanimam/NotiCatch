import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChatsTab } from '@/components/tabs/ChatsTab';
import { NotificationsTab } from '@/components/tabs/NotificationsTab';
import { MoreTab } from '@/components/tabs/MoreTab';
import { getConversations, queryNotifications } from '@/data/repository';
import { useLiveQuery } from '@/hooks/useLiveQuery';

interface Props {
  initialTab?: number;
}

const TABS = [
  {
    key: 'chats',
    label: 'Messages',
    activeIcon: 'chatbubble' as const,
    inactiveIcon: 'chatbubble-outline' as const,
    size: 22,
  },
  {
    key: 'notifications',
    label: 'Notifications',
    activeIcon: 'notifications' as const,
    inactiveIcon: 'notifications-outline' as const,
    size: 23,
  },
  {
    key: 'more',
    label: 'More',
    activeIcon: 'ellipsis-horizontal' as const,
    inactiveIcon: 'ellipsis-horizontal-outline' as const,
    size: 24,
  },
];

export function MainPager({ initialTab = 1 }: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const [activeTab, setActiveTab] = useState(initialTab);
  const isScrollingRef = useRef(false);

  // Unread badge query for live red/teal dot badges
  const { data: unreadNotifs } = useLiveQuery(
    () => queryNotifications({ archived: 'exclude', limit: 20 }),
    [],
  );
  const { data: conversations } = useLiveQuery(getConversations, []);

  const hasUnreadNotifications = (unreadNotifs?.length ?? 0) > 0;
  const hasUnreadMessages = (conversations ?? []).some((c) => (c.unreadCount ?? 0) > 0);

  // Handle initial tab positioning
  useEffect(() => {
    if (initialTab > 0 && width > 0) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ x: initialTab * width, animated: false });
      }, 50);
    }
  }, [width, initialTab]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (width <= 0) return;
      const x = e.nativeEvent.contentOffset.x;
      const page = Math.round(x / width);
      if (page >= 0 && page < TABS.length && page !== activeTab) {
        setActiveTab(page);
      }
    },
    [width, activeTab],
  );

  const handleTabPress = useCallback(
    (idx: number) => {
      setActiveTab(idx);
      isScrollingRef.current = true;
      scrollRef.current?.scrollTo({ x: idx * width, animated: true });
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 350);
    },
    [width],
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#232630' }}>
      {/* 1. Horizontal Swipeable Pager */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        directionalLockEnabled={true}
        nestedScrollEnabled={true}
        overScrollMode="never"
        scrollEventThrottle={16}
        onScroll={handleScroll}
        contentOffset={{ x: initialTab * width, y: 0 }}
        style={{ flex: 1 }}
      >
        {/* Slide 0: Messages */}
        <View style={{ width, flex: 1 }}>
          <ChatsTab />
        </View>

        {/* Slide 1: Notifications (Home) */}
        <View style={{ width, flex: 1 }}>
          <NotificationsTab />
        </View>

        {/* Slide 2: More / Settings */}
        <View style={{ width, flex: 1 }}>
          <MoreTab />
        </View>
      </ScrollView>

      {/* 2. Custom Minimalist Bottom Navigation Bar */}
      <View
        style={{
          backgroundColor: '#232630',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 10),
          paddingHorizontal: 16,
        }}
      >
        {TABS.map((tab, idx) => {
          const isActive = activeTab === idx;
          const showBadge =
            (idx === 0 && hasUnreadMessages) ||
            (idx === 1 && hasUnreadNotifications);

          return (
            <Pressable
              key={tab.key}
              onPress={() => handleTabPress(idx)}
              style={({ pressed }) => [
                {
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 8,
                  paddingHorizontal: 24,
                  opacity: pressed ? 0.6 : 1,
                },
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
            >
              <View
                style={{
                  position: 'relative',
                  width: 28,
                  height: 28,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name={isActive ? tab.activeIcon : tab.inactiveIcon}
                  size={tab.size}
                  color={isActive ? '#FFFFFF' : '#7C8494'}
                />

                {showBadge && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 1,
                      right: -1,
                      width: 7,
                      height: 7,
                      borderRadius: 3.5,
                      backgroundColor: '#EF4444',
                      borderWidth: 1.5,
                      borderColor: '#232630',
                    }}
                  />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
