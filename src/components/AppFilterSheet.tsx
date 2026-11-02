import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { getAppSummaries } from '@/data/repository';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { MIN_TOUCH, space, useTheme } from '@/theme';
import { AppIcon } from './AppIcon';
import { SearchBar } from './SearchBar';
import { Sheet } from './Sheet';
import { EmptyState, ErrorState, LoadingState } from './states';
import { Button, Text } from './ui';

export function AppFilterSheet({ visible, selected, onClose, onApply }: { visible: boolean; selected: string[]; onClose: () => void; onApply: (packages: string[]) => void }) {
  const { colors } = useTheme();
  const { data, loading, error, reload } = useLiveQuery(getAppSummaries, []);
  const [draft, setDraft] = useState<string[]>(selected);
  const [query, setQuery] = useState('');
  const [lastVisible, setLastVisible] = useState(visible);
  if (visible !== lastVisible) { setLastVisible(visible); if (visible) { setDraft(selected); setQuery(''); } }

  const list = useMemo(() => (data ?? []).filter((a) => a.appName.toLowerCase().includes(query.trim().toLowerCase())), [data, query]);
  const toggle = (pkg: string) => setDraft((d) => (d.includes(pkg) ? d.filter((p) => p !== pkg) : [...d, pkg]));

  return (
    <Sheet visible={visible} title="Filter by app" onClose={onClose} maxHeight="90%">
      <View style={{ paddingHorizontal: space.lg, gap: space.md }}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search apps" />
      </View>
      <View style={{ height: 360 }}>
        {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={reload} /> : list.length === 0 ? (
          <EmptyState icon="apps-outline" title="No apps yet" message="Apps appear here after their first notification is saved." />
        ) : (
          <FlatList
            data={list} keyExtractor={(a) => a.packageName} keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: space.lg }}
            renderItem={({ item }) => {
              const on = draft.includes(item.packageName);
              return (
                <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={`${item.appName}, ${item.count} notifications`} onPress={() => toggle(item.packageName)} style={{ minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                  <AppIcon packageName={item.packageName} name={item.appName} size={40} />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong" numberOfLines={1}>{item.appName}</Text>
                    <Text variant="caption" muted>{item.count} saved</Text>
                  </View>
                  <Ionicons name={on ? 'checkbox' : 'square-outline'} size={26} color={on ? colors.primary : colors.textMuted} />
                </Pressable>
              );
            }}
          />
        )}
      </View>
      <View style={{ flexDirection: 'row', gap: space.md, paddingHorizontal: space.lg, paddingTop: space.md }}>
        <Button title="Clear" kind="secondary" style={{ flex: 1, minHeight: MIN_TOUCH }} onPress={() => setDraft([])} />
        <Button title={draft.length ? `Apply (${draft.length})` : 'Apply'} style={{ flex: 2 }} onPress={() => { onApply(draft); onClose(); }} />
      </View>
    </Sheet>
  );
}
