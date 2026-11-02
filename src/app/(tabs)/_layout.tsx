import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableBounce } from '@/components/PressableBounce';
import { queryNotifications } from '@/data/repository';
import { useLiveQuery } from '@/hooks/useLiveQuery';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  // Query unread count for the pink dot badge matching Notisave screenshots
  const { data: unreadList } = useLiveQuery(
    () => queryNotifications({ archived: 'exclude', limit: 20 }),
    [],
  );
  const hasUnread = (unreadList?.length ?? 0) > 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarButton: (props) => (
          <PressableBounce
            {...props}
            scaleTo={0.9}
            activeOpacity={0.8}
            style={[props.style, { alignItems: 'center', justifyContent: 'center' }]}
          >
            {props.children}
          </PressableBounce>
        ),
        tabBarStyle: {
          backgroundColor: '#232630',
          borderTopWidth: 0,
          borderTopColor: 'transparent',
          elevation: 0,
          shadowOpacity: 0,
          shadowOffset: { width: 0, height: 0 },
          height: Platform.OS === 'ios' ? 58 + insets.bottom : (insets.bottom > 0 ? 58 + insets.bottom : 58),
          paddingBottom: Platform.OS === 'ios' ? Math.max(16, insets.bottom) : (insets.bottom > 0 ? insets.bottom : 8),
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#7C8494',
      }}
    >
      {/* Tab 1: Messages (Chat bubble matching Screenshot 1 & 4) */}
      <Tabs.Screen
        name="chats"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{ position: 'relative', width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons
                name={focused ? 'chatbubble' : 'chatbubble-outline'}
                size={23}
                color={focused ? '#FFFFFF' : '#7C8494'}
              />
              {hasUnread ? (
                <View
                  style={{
                    position: 'absolute',
                    top: 1,
                    right: -1,
                    width: 7,
                    height: 7,
                    borderRadius: 3.5,
                    backgroundColor: '#0A6C74',
                    borderWidth: 1.5,
                    borderColor: '#232630',
                  }}
                />
              ) : null}
            </View>
          ),
        }}
      />

      {/* Tab 2: Notifications (Bell icon matching Screenshots 1 & 4) */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{ position: 'relative', width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons
                name={focused ? 'notifications' : 'notifications-outline'}
                size={24}
                color={focused ? '#FFFFFF' : '#7C8494'}
              />
              {hasUnread ? (
                <View
                  style={{
                    position: 'absolute',
                    top: 1,
                    right: 0,
                    width: 7,
                    height: 7,
                    borderRadius: 3.5,
                    backgroundColor: '#0A6C74',
                    borderWidth: 1.5,
                    borderColor: '#232630',
                  }}
                />
              ) : null}
            </View>
          ),
        }}
      />

      {/* Tab 3: More (Three horizontal dots matching Screenshot 3 & 4) */}
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons
                name={focused ? 'ellipsis-horizontal' : 'ellipsis-horizontal-outline'}
                size={25}
                color={focused ? '#FFFFFF' : '#7C8494'}
              />
            </View>
          ),
        }}
      />

      {/* Hidden from bar */}
      <Tabs.Screen name="history" options={{ href: null }} />
    </Tabs>
  );
}
