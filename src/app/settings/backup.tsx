import { useState } from 'react';
import { Screen } from '@/components/Screen';
import { Banner } from '@/components/states';
import { showAppConfirm, showAppToast } from '@/components/CustomDialog';
import { Button, Group, Row, Segmented, Text } from '@/components/ui';
import { createFullBackup, exportRecords, pickBackupForRestore, type ExportFormat } from '@/data/exporter';
import { queryNotifications } from '@/data/repository';
import { addDays, startOfDay } from '@/lib/time';
import { useDataVersion } from '@/store/dataVersion';
import { space } from '@/theme';

type Scope = 'all' | '7' | '30' | 'fav';

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

export default function Backup() {
  const bump = useDataVersion((s) => s.bump);
  const [scope, setScope] = useState<Scope>('all');
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [busy, setBusy] = useState<null | 'export' | 'backup' | 'restore'>(null);

  const doExport = async () => {
    setBusy('export');
    try {
      const filter = { archived: 'include' as const, limit: 1000, favoritesOnly: scope === 'fav', from: scope === '7' ? addDays(startOfDay(Date.now()), -6) : scope === '30' ? addDays(startOfDay(Date.now()), -29) : null };
      const rows = [];
      for (let offset = 0; ; offset += 1000) {
        const page = await queryNotifications({ ...filter, offset });
        rows.push(...page);
        if (page.length < 1000) break;
      }
      await exportRecords(rows, format);
      showAppToast(`Exported ${rows.length} notifications`);
    } catch (e) { showAppToast(msg(e), 'error'); } finally { setBusy(null); }
  };

  const doBackup = async () => {
    setBusy('backup');
    try { const n = await createFullBackup(); showAppToast(`Backup packaged with ${n} notifications`); }
    catch (e) { showAppToast(msg(e), 'error'); } finally { setBusy(null); }
  };

  const doRestore = async () => {
    setBusy('restore');
    try {
      const out = await pickBackupForRestore();
      if (out.status === 'cancelled') return;
      if (out.status === 'invalid') { showAppToast(out.error ?? 'Invalid file', 'error'); return; }
      const when = out.createdAt ? new Date(out.createdAt).toLocaleDateString() : 'unknown date';
      showAppConfirm(
        'Restore backup?',
        `${out.count} notifications from ${when}. Existing entries are kept; duplicates are skipped.`,
        () => void out.commit().then((r) => { bump(); showAppToast(`${r.inserted} added, ${r.skipped} skipped`); }).catch((e) => showAppToast(msg(e), 'error')),
      );
    } catch (e) { showAppToast(msg(e), 'error'); } finally { setBusy(null); }
  };

  return (
    <Screen scroll edges={[]}>
      <Banner tone="info" icon="shield-checkmark-outline" title="Files stay under your control" message="NotiCatch never uploads anything. Exports open Android’s share sheet so you choose where the file goes." />
      <Text variant="heading" style={{ marginTop: space.xl, marginBottom: space.sm }}>Export history</Text>
      <Text variant="label" muted style={{ marginBottom: space.sm }}>What to include</Text>
      <Segmented value={scope} onChange={setScope} options={[{ value: 'all', label: 'All' }, { value: '30', label: '30 days' }, { value: '7', label: '7 days' }, { value: 'fav', label: 'Favorites' }]} />
      <Text variant="label" muted style={{ marginTop: space.lg, marginBottom: space.sm }}>Format</Text>
      <Segmented value={format} onChange={setFormat} options={[{ value: 'csv', label: 'CSV (spreadsheet)' }, { value: 'json', label: 'JSON' }]} />
      <Button title="Export" icon="share-outline" onPress={() => void doExport()} loading={busy === 'export'} disabled={busy !== null} style={{ marginTop: space.lg, marginBottom: space.xl }} />

      <Group title="Backup & restore" footer="A backup contains every saved notification including archived items. Anyone with the file can read it, so store it somewhere private.">
        <Row icon="save-outline" title="Create backup" subtitle="Save a JSON file of everything" chevron onPress={() => void doBackup()} />
        <Row icon="download-outline" title="Restore from backup" subtitle="Validated before anything is imported" chevron last onPress={() => void doRestore()} />
      </Group>
      {busy === 'backup' || busy === 'restore' ? <Text variant="caption" muted style={{ textAlign: 'center' }}>Working…</Text> : null}
    </Screen>
  );
}
