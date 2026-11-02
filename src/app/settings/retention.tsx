import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Screen } from '@/components/Screen';
import { showAppToast } from '@/components/CustomDialog';
import { Button, Group, Row, Text, ToggleRow } from '@/components/ui';
import { runRetentionCleanup } from '@/data/lifecycle';
import { RETENTION_OPTIONS } from '@/lib/retention';
import { useSettings } from '@/store/settings';
import { space, useTheme } from '@/theme';

export default function Retention() {
  const { colors } = useTheme();
  const s = useSettings();
  const [busy, setBusy] = useState(false);

  const cleanNow = async () => {
    setBusy(true);
    const n = await runRetentionCleanup();
    setBusy(false);
    showAppToast(n === 0 ? 'Nothing was old enough to delete' : `${n} old notifications deleted`);
  };

  return (
    <Screen scroll edges={[]}>
      <Group title="Delete notifications older than" footer="Cleanup runs when the app opens and while notifications are being captured. It is based on when the notification was posted.">
        {RETENTION_OPTIONS.map((o, i) => (
          <Row
            key={String(o.days)} title={o.label} subtitle={o.hint} last={i === RETENTION_OPTIONS.length - 1}
            onPress={() => s.update({ retentionDays: o.days })}
            right={<Ionicons name={s.retentionDays === o.days ? 'radio-button-on' : 'radio-button-off'} size={24} color={s.retentionDays === o.days ? colors.primary : colors.textMuted} />}
          />
        ))}
      </Group>
      <Group title="Always keep" footer="Items you keep are skipped by automatic cleanup. “Clear all history” on Home is separate.">
        <ToggleRow icon="star-outline" title="Favorites" value={s.keepFavorites} onValueChange={(v) => s.update({ keepFavorites: v })} />
        <ToggleRow icon="archive-outline" title="Archived" value={s.keepArchived} onValueChange={(v) => s.update({ keepArchived: v })} last />
      </Group>
      <Button title="Run cleanup now" icon="trash-bin-outline" kind="secondary" loading={busy} disabled={s.retentionDays === null} onPress={() => void cleanNow()} />
      {s.retentionDays === null ? <Text variant="caption" muted style={{ marginTop: space.sm, textAlign: 'center' }}>Choose a time period to enable cleanup.</Text> : null}
    </Screen>
  );
}
