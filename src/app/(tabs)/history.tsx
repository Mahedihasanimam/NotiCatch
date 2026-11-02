import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, SectionList, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { showAppToast } from '@/components/CustomDialog';
import { AppFilterSheet } from '@/components/AppFilterSheet';
import { AppIcon } from '@/components/AppIcon';
import { ANY_TIME, DateRangeSheet, type DateRange } from '@/components/DateRangeSheet';
import { NotificationCard } from '@/components/NotificationCard';
import { ScreenHeader } from '@/components/Screen';
import { SearchBar } from '@/components/SearchBar';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { Chip, IconButton, Segmented, Text } from '@/components/ui';
import { exportRecords, type ExportFormat } from '@/data/exporter';
import { deleteNotifications, getNotificationsByIds, setArchived, setFavorite } from '@/data/repository';
import { useDebounced } from '@/hooks/useDebounced';
import { usePagedNotifications } from '@/hooks/usePagedNotifications';
import { useSelection } from '@/hooks/useSelection';
import { confirm } from '@/lib/confirm';
import { groupByApp, groupByDate } from '@/lib/grouping';
import type { NotificationRecord } from '@/lib/types';
import { useDataVersion } from '@/store/dataVersion';
import { useSettings } from '@/store/settings';
import { space, useTheme } from '@/theme';

export default function History() {
  const { top } = useSafeAreaInsets();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ filter?: string; focus?: string }>();
  const groupMode = useSettings((s) => s.groupMode);
  const updateSettings = useSettings((s) => s.update);
  const bump = useDataVersion((s) => s.bump);

  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState('');
  const [range, setRange] = useState<DateRange>(ANY_TIME);
  const [packages, setPackages] = useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [archivedOnly, setArchivedOnly] = useState(false);
  const [deletedOnly, setDeletedOnly] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [appsOpen, setAppsOpen] = useState(false);
  const search = useDebounced(query, 250);
  const selection = useSelection();

  useEffect(() => {
    if (params.filter === 'favorites') { setFavoritesOnly(true); setArchivedOnly(false); setDeletedOnly(false); }
    else if (params.filter === 'archived') { setArchivedOnly(true); setFavoritesOnly(false); setDeletedOnly(false); }
    else if (params.filter === 'deleted') { setDeletedOnly(true); setFavoritesOnly(false); setArchivedOnly(false); }
    if (params.focus === 'search') setShowSearch(true);
  }, [params.filter, params.focus]);

  const filter = useMemo(
    () => ({ search, packages, from: range.from, to: range.to, favoritesOnly, deletedOnly, archived: archivedOnly ? ('only' as const) : ('exclude' as const) }),
    [search, packages, range, favoritesOnly, deletedOnly, archivedOnly],
  );
  const { items, loading, loadingMore, error, loadMore, reload } = usePagedNotifications(filter);
  const now = Date.now();
  const sections = useMemo(() => (groupMode === 'date' ? groupByDate(items, now) : groupByApp(items)), [items, groupMode, now]);
  const hasFilters = !!search || packages.length > 0 || range.from !== null || favoritesOnly || archivedOnly || deletedOnly;

  const open = useCallback((n: NotificationRecord) => {
    if (selection.active) selection.toggle(n.id);
    else router.push({ pathname: '/notification/[id]', params: { id: String(n.id) } });
  }, [selection]);
  const longPress = useCallback((n: NotificationRecord) => selection.toggle(n.id), [selection]);

  const clearFilters = () => { setQuery(''); setRange(ANY_TIME); setPackages([]); setFavoritesOnly(false); setArchivedOnly(false); setDeletedOnly(false); };

  const bulk = async (fn: () => Promise<unknown>) => {
    try { await fn(); selection.clear(); bump(); } catch (e) { showAppToast(e instanceof Error ? e.message : String(e), 'error'); }
  };
  const selectedRecords = () => items.filter((i) => selection.selected.has(i.id));
  const allFavorite = selection.active && selectedRecords().every((r) => r.isFavorite);

  const runExport = (format: ExportFormat) => void (async () => {
    try { await exportRecords(await getNotificationsByIds(selection.ids), format); selection.clear(); showAppToast('Export completed'); }
    catch (e) { showAppToast(e instanceof Error ? e.message : String(e), 'error'); }
  })();

  const chooseExport = () => runExport('json');

  const askDelete = () => confirm({
    title: `Delete ${selection.count} notification${selection.count === 1 ? '' : 's'}?`, message: 'They will be removed from this device permanently.',
    confirmLabel: 'Delete', destructive: true, onConfirm: () => bulk(() => deleteNotifications(selection.ids)),
  });

  return (
    <SafeAreaView
      edges={[]}
      style={[
        { flex: 1, backgroundColor: colors.bg },
        {
          paddingTop: top,
        },
      ]}
    >
      {selection.active ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.sm, paddingVertical: space.sm }}>
          <IconButton icon="close" label="Cancel selection" onPress={selection.clear} />
          <Text variant="heading" style={{ flex: 1 }} accessibilityLiveRegion="polite">{selection.count} selected</Text>
          <IconButton icon="checkmark-done" label="Select all loaded" onPress={() => selection.selectAll(items.map((i) => i.id))} />
          <IconButton icon={allFavorite ? 'star' : 'star-outline'} label={allFavorite ? 'Remove from favorites' : 'Add to favorites'} onPress={() => void bulk(() => setFavorite(selection.ids, !allFavorite))} />
          <IconButton icon={archivedOnly ? 'arrow-undo' : 'archive-outline'} label={archivedOnly ? 'Restore from archive' : 'Archive'} onPress={() => void bulk(() => setArchived(selection.ids, !archivedOnly))} />
          <IconButton icon="share-outline" label="Export selected" onPress={chooseExport} />
          <IconButton icon="trash-outline" label="Delete selected" color={colors.danger} onPress={askDelete} />
        </View>
      ) : (
        <ScreenHeader
          title={deletedOnly ? 'Deleted Messages' : archivedOnly ? 'Archive' : 'History'}
          subtitle={items.length > 0 ? `${items.length}${items.length >= 60 ? '+' : ''} shown` : undefined}
          actions={[{ icon: 'search', label: showSearch ? 'Hide search' : 'Search', active: showSearch, onPress: () => setShowSearch((v) => !v) }]}
        />
      )}

      {showSearch && !selection.active ? (
        <View style={{ paddingHorizontal: space.lg, paddingBottom: space.sm }}>
          <SearchBar value={query} onChangeText={setQuery} placeholder="Search title and content" autoFocus={params.focus === 'search'} />
        </View>
      ) : null}

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space.lg, gap: space.sm, paddingBottom: space.sm }}>
          <Chip label={range.from !== null ? range.label : 'Date'} icon="calendar-outline" selected={range.from !== null} onPress={() => setDateOpen(true)} onClear={() => setRange(ANY_TIME)} />
          <Chip label={packages.length ? `${packages.length} app${packages.length === 1 ? '' : 's'}` : 'App'} icon="apps-outline" selected={packages.length > 0} onPress={() => setAppsOpen(true)} onClear={() => setPackages([])} />
          <Chip label="Favorites" icon="star-outline" selected={favoritesOnly} onPress={() => { setFavoritesOnly((v) => !v); if (!favoritesOnly) setDeletedOnly(false); }} />
          <Chip label="Deleted" icon="trash-outline" selected={deletedOnly} onPress={() => { setDeletedOnly((v) => !v); if (!deletedOnly) { setFavoritesOnly(false); setArchivedOnly(false); } }} />
          <Chip label="Archived" icon="archive-outline" selected={archivedOnly} onPress={() => { setArchivedOnly((v) => !v); if (!archivedOnly) setDeletedOnly(false); }} />
          {hasFilters ? <Chip label="Reset" icon="refresh" onPress={clearFilters} /> : null}
        </ScrollView>
        <View style={{ paddingHorizontal: space.lg, paddingBottom: space.sm }}>
          <Segmented
            value={groupMode}
            onChange={(v) => updateSettings({ groupMode: v })}
            options={[{ value: 'date', label: 'Group by date' }, { value: 'app', label: 'Group by app' }]}
          />
        </View>
      </View>

      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <SectionList
          sections={sections}
          keyExtractor={(n) => String(n.id)}
          stickySectionHeadersEnabled
          contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: space.xxl * 2, flexGrow: 1 }}
          onEndReached={() => void loadMore()}
          onEndReachedThreshold={0.6}
          initialNumToRender={12}
          windowSize={9}
          removeClippedSubviews
          renderSectionHeader={({ section }) => (
            <View style={{ backgroundColor: colors.bg, paddingVertical: space.sm, flexDirection: 'row', alignItems: 'center', gap: space.sm }} accessibilityRole="header">
              {groupMode === 'app' && section.data[0] ? <AppIcon packageName={section.data[0].packageName} name={section.title} size={24} /> : null}
              <Text variant="label" muted style={{ flex: 1 }}>{section.title}</Text>
              {groupMode === 'app' ? <Text variant="caption" muted>{section.data.length}</Text> : null}
            </View>
          )}
          renderItem={({ item }) => (
            <NotificationCard item={item} now={now} selecting={selection.active} selected={selection.selected.has(item.id)} showApp={groupMode !== 'app'} onPress={open} onLongPress={longPress} />
          )}
          ListEmptyComponent={
            hasFilters ? (
              <EmptyState icon="funnel-outline" title="No matches" message="Nothing fits these filters. Try a different search or date range." actionLabel="Reset filters" onAction={clearFilters} />
            ) : (
              <EmptyState icon="notifications-outline" title="No history yet" message="Saved notifications appear here. Make sure notification access is on in Settings." actionLabel="Open Settings" onAction={() => router.push('/settings')} />
            )
          }
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ padding: space.lg }} color={colors.primary} /> : <View />}
        />
      )}

      <DateRangeSheet visible={dateOpen} onClose={() => setDateOpen(false)} onApply={setRange} />
      <AppFilterSheet visible={appsOpen} selected={packages} onClose={() => setAppsOpen(false)} onApply={setPackages} />
    </SafeAreaView>
  );
}
