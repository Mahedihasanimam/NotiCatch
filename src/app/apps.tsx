import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Platform, Switch, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/AppIcon';
import { PressableBounce } from '@/components/PressableBounce';
import { promptNotificationPermissionIfNeeded } from '@/components/CustomDialog';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { Text } from '@/components/ui';
import { getInstalledApps } from '@/data/repository';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { useAccess } from '@/store/access';
import { useSettings } from '@/store/settings';

const ROW_H = 68;

export default function AppsScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const granted = useAccess((s) => s.granted);
  const { data, loading, error, reload } = useLiveQuery(getInstalledApps, []);
  const excluded = useSettings((s) => s.excludedPackages);
  const toggle = useSettings((s) => s.toggleExcluded);
  const setExcluded = useSettings((s) => s.setExcluded);
  const [query, setQuery] = useState('');

  const excludedSet = useMemo(() => new Set(excluded), [excluded]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter(
      (a) => !q || a.label.toLowerCase().includes(q) || a.packageName.toLowerCase().includes(q),
    );
  }, [data, query]);

  const total = data?.length ?? 0;
  const capturing = (data ?? []).filter((a) => !excludedSet.has(a.packageName)).length;
  const isAllSaved = total > 0 && capturing === total;
  const isAllBlocked = total > 0 && capturing === 0;

  const handleSaveAll = () => {
    if (!promptNotificationPermissionIfNeeded()) return;
    setExcluded(excluded.filter((p) => !filtered.some((a) => a.packageName === p)));
  };

  const handleBlockAll = () => {
    setExcluded([...excluded, ...filtered.map((a) => a.packageName)]);
  };

  const handleToggleMaster = () => {
    if (isAllSaved || capturing > 0) {
      // If all or some are active, toggle all to blocked
      if (data) {
        setExcluded(data.map((a) => a.packageName));
      }
    } else {
      // If all blocked, prompt if needed before turning on
      if (!promptNotificationPermissionIfNeeded()) return;
      setExcluded([]);
    }
  };

  const handleToggleApp = (pkg: string) => {
    const isCurrentlyBlocked = excludedSet.has(pkg);
    // If user is enabling capture for this app, ensure permission is granted
    if (isCurrentlyBlocked && !promptNotificationPermissionIfNeeded()) {
      return;
    }
    toggle(pkg);
  };

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
      {/* 1. Top Header with Back button */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 14,
          backgroundColor: '#232630',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255,255,255,0.06)',
        }}
      >
        <PressableBounce hitSlop={12} onPress={() => router.back()} scaleTo={0.9}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </PressableBounce>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 19,
              fontFamily: 'Manrope_700Bold',
              color: '#FFFFFF',
            }}
          >
            Block notifications
          </Text>
          {data ? (
            <Text
              style={{
                fontSize: 12.5,
                color: '#7C8494',
                fontFamily: 'Manrope_500Medium',
                marginTop: 1,
              }}
            >
              {capturing} of {total} apps saving notifications
            </Text>
          ) : null}
        </View>
      </View>


      {/* 2. Search & Professional Master Controls Container */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, gap: 10 }}>
        {/* Sleek Search Bar */}
        <View
          style={{
            height: 44,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#2E323F',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
            paddingHorizontal: 14,
            gap: 10,
          }}
        >
          <Ionicons name="search" size={18} color="#7C8494" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search apps by name or package..."
            placeholderTextColor="#7C8494"
            autoCorrect={false}
            autoCapitalize="none"
            style={{
              flex: 1,
              height: 44,
              color: '#FFFFFF',
              fontFamily: 'Manrope_500Medium',
              fontSize: 14,
            }}
          />
          {query ? (
            <PressableBounce hitSlop={8} onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color="#7C8494" />
            </PressableBounce>
          ) : null}
        </View>

        {/* Professional Master Card with Live Stats & Quick Action Pills */}
        <View
          style={{
            backgroundColor: '#2E323F',
            borderRadius: 14,
            borderWidth: 1,
            borderColor: isAllSaved ? 'rgba(13, 148, 136, 0.4)' : 'rgba(255,255,255,0.08)',
            padding: 14,
            gap: 12,
          }}
        >
          {/* Top Row: Master Shield Badge + Label + Master Switch */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <PressableBounce
              disabled={granted}
              onPress={() => {
                if (!granted) promptNotificationPermissionIfNeeded();
              }}
              scaleTo={granted ? 1 : 0.98}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  backgroundColor: !granted ? 'rgba(245, 158, 11, 0.15)' : isAllSaved ? 'rgba(13, 148, 136, 0.2)' : '#363A49',
                  borderWidth: 1,
                  borderColor: !granted ? 'rgba(245, 158, 11, 0.4)' : isAllSaved ? '#0D9488' : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name={!granted ? 'alert-circle' : isAllSaved ? 'shield-checkmark' : isAllBlocked ? 'shield-outline' : 'shield-half'}
                  size={20}
                  color={!granted ? '#F59E0B' : isAllSaved ? '#0D9488' : '#7C8494'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontFamily: 'Manrope_700Bold', color: '#FFFFFF' }}>
                  All Applications
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Manrope_500Medium',
                    color: !granted ? '#F59E0B' : isAllSaved ? '#0D9488' : '#7C8494',
                    marginTop: 1,
                  }}
                >
                  {!granted
                    ? 'Permission needed • Tap to enable'
                    : isAllSaved
                    ? `All ${total} apps capturing notifications`
                    : isAllBlocked
                    ? 'All apps blocked from saving'
                    : `Saving ${capturing} of ${total} apps`}
                </Text>
              </View>
            </PressableBounce>

            <Switch
              value={!isAllBlocked && capturing > 0}
              onValueChange={handleToggleMaster}
              trackColor={{ false: '#363A49', true: '#0A6C74' }}
              thumbColor={!isAllBlocked && capturing > 0 ? '#0D9488' : '#7C8494'}
            />
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)' }} />

          {/* Bottom Row: Quick Batch Action Buttons */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {/* Save All / Filtered Button */}
            <PressableBounce
              onPress={handleSaveAll}
              disabled={filtered.length === 0 || capturing === total}
              scaleTo={0.96}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                height: 36,
                borderRadius: 8,
                backgroundColor:
                  filtered.length === 0 || capturing === total
                    ? 'rgba(255,255,255,0.03)'
                    : 'rgba(13, 148, 136, 0.15)',
                borderWidth: 1,
                borderColor:
                  filtered.length === 0 || capturing === total
                    ? 'rgba(255,255,255,0.05)'
                    : 'rgba(13, 148, 136, 0.4)',
              }}
            >
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={
                  filtered.length === 0 || capturing === total
                    ? '#525B6C'
                    : '#0D9488'
                }
              />
              <Text
                style={{
                  fontSize: 12.5,
                  fontFamily: 'Manrope_700Bold',
                  color:
                    filtered.length === 0 || capturing === total
                      ? '#525B6C'
                      : '#0D9488',
                }}
              >
                {query ? `Save filtered (${filtered.length})` : 'Save all apps'}
              </Text>
            </PressableBounce>

            {/* Block All / Filtered Button */}
            <PressableBounce
              onPress={handleBlockAll}
              disabled={filtered.length === 0 || capturing === 0}
              scaleTo={0.96}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                height: 36,
                borderRadius: 8,
                backgroundColor:
                  filtered.length === 0 || capturing === 0
                    ? 'rgba(255,255,255,0.03)'
                    : 'rgba(239, 68, 68, 0.12)',
                borderWidth: 1,
                borderColor:
                  filtered.length === 0 || capturing === 0
                    ? 'rgba(255,255,255,0.05)'
                    : 'rgba(239, 68, 68, 0.3)',
              }}
            >
              <Ionicons
                name="ban-outline"
                size={15}
                color={
                  filtered.length === 0 || capturing === 0
                    ? '#525B6C'
                    : '#EF4444'
                }
              />
              <Text
                style={{
                  fontSize: 12.5,
                  fontFamily: 'Manrope_700Bold',
                  color:
                    filtered.length === 0 || capturing === 0
                      ? '#525B6C'
                      : '#EF4444',
                }}
              >
                {query ? `Block filtered (${filtered.length})` : 'Block all apps'}
              </Text>
            </PressableBounce>
          </View>
        </View>
      </View>

      {/* 3. Apps List */}
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(a) => a.packageName}
          getItemLayout={(_d, i) => ({ length: ROW_H, offset: ROW_H * i, index: i })}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, flexGrow: 1 }}
          initialNumToRender={14}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <EmptyState
              icon="apps-outline"
              title="No apps found"
              message={
                query
                  ? 'No installed app matches your search.'
                  : 'No launchable apps were found on this device.'
              }
            />
          }
          ListFooterComponent={
            filtered.length ? (
              <Text
                variant="caption"
                muted
                style={{ marginTop: 16, paddingHorizontal: 4, lineHeight: 18 }}
              >
                Apps without a launcher icon (some system services) are always saved unless you exclude
                them elsewhere. Turning an app off stops new captures; it does not delete what is already
                saved.
              </Text>
            ) : (
              <View />
            )
          }
          renderItem={({ item }) => {
            const on = !excludedSet.has(item.packageName);
            return (
              <PressableBounce
                scaleTo={0.99}
                onPress={() => handleToggleApp(item.packageName)}
                accessible
                accessibilityRole="switch"
                accessibilityLabel={item.label}
                accessibilityState={{ checked: on }}
                style={{
                  height: ROW_H,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: 'rgba(255,255,255,0.06)',
                }}
              >
                <AppIcon packageName={item.packageName} name={item.label} size={42} />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontFamily: 'Manrope_600SemiBold',
                      color: '#FFFFFF',
                    }}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12.5,
                      fontFamily: 'Manrope_500Medium',
                      color: on ? '#0D9488' : '#7C8494',
                      marginTop: 2,
                    }}
                    numberOfLines={1}
                  >
                    {on ? 'Saving notifications' : 'Blocked / Excluded'}
                  </Text>
                </View>
                <Switch
                  value={on}
                  onValueChange={() => handleToggleApp(item.packageName)}
                  trackColor={{ false: '#363A49', true: '#0A6C74' }}
                  thumbColor={on ? '#0D9488' : '#7C8494'}
                  importantForAccessibility="no-hide-descendants"
                />
              </PressableBounce>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
