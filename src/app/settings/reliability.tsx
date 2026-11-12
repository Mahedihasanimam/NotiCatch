import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { AppState, View } from 'react-native';
import { showAppToast } from '@/components/CustomDialog';
import { Screen } from '@/components/Screen';
import { Banner } from '@/components/states';
import { Group, Row, Text } from '@/components/ui';
import {
  type DeviceBrand,
  type ReliabilityStatus,
  getReliabilityStatus,
  openAccessSettings,
  openAutostartSettings,
  openBatterySettings,
  postTestNotification,
  requestRebind,
} from '@/data/repository';
import { formatRelative } from '@/lib/time';
import { useAccess } from '@/store/access';
import { space, useTheme } from '@/theme';

/** Where each OEM hides the "let this app run in background" switches. */
export const BRAND_STEPS: Record<DeviceBrand, { name: string; steps: string[] }> = {
  xiaomi: {
    name: 'Xiaomi / Redmi / POCO',
    steps: [
      'Autostart: turn ON for NotiCatch.',
      'Battery saver: choose "No restrictions".',
      'Open Recents, long-press NotiCatch and tap the lock icon.',
    ],
  },
  samsung: {
    name: 'Samsung',
    steps: [
      'Battery: set NotiCatch to "Unrestricted".',
      'Device care › Battery › Background usage limits: remove NotiCatch from "Sleeping apps" / "Deep sleeping apps".',
    ],
  },
  oppo: {
    name: 'OPPO / Realme / OnePlus',
    steps: [
      'Auto launch / Startup manager: turn ON for NotiCatch.',
      'Battery usage: allow background activity.',
      'Open Recents, pull NotiCatch down (or tap ⋮) and choose "Lock".',
    ],
  },
  vivo: {
    name: 'vivo / iQOO',
    steps: [
      'Background startup / Autostart: turn ON for NotiCatch.',
      'Battery › Background power consumption: allow NotiCatch.',
      'Open Recents and lock NotiCatch.',
    ],
  },
  huawei: {
    name: 'Huawei / Honor',
    steps: ['App launch: turn off "Manage automatically", then enable Auto-launch, Secondary launch and Run in background.'],
  },
  transsion: {
    name: 'Infinix / TECNO / itel',
    steps: [
      'Phone Master › Auto-start: turn ON for NotiCatch.',
      'Battery: set NotiCatch to "Don\'t restrict" / unrestricted.',
    ],
  },
  other: {
    name: 'Your phone',
    steps: ['Battery: set NotiCatch to "Unrestricted" / "Don\'t optimize".', 'If your phone has an Autostart setting, turn it ON for NotiCatch.'],
  },
};

/** Captures older than this, while access is on, suggest the system has stopped us. */
const STALE_MS = 24 * 60 * 60 * 1000;

function StatusIcon({ ok }: { ok: boolean }) {
  const { colors } = useTheme();
  return <Ionicons name={ok ? 'checkmark-circle' : 'alert-circle'} size={22} color={ok ? colors.primary : colors.danger} />;
}

export default function ReliabilityScreen() {
  const { colors } = useTheme();
  const granted = useAccess((s) => s.granted);
  const [status, setStatus] = useState<ReliabilityStatus | null>(null);

  const refresh = useCallback(() => {
    void getReliabilityStatus().then(setStatus);
  }, []);

  // Re-check whenever the user comes back from a system settings screen.
  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const brand = BRAND_STEPS[status?.brand ?? 'other'];
  const stale = !!status?.lastCapturedAt && Date.now() - status.lastCapturedAt > STALE_MS;
  const allGood = granted && !!status?.batteryUnrestricted && !!status?.listenerConnected;

  const open = async (fn: () => Promise<boolean>) => {
    const ok = await fn();
    if (!ok) showAppToast('Could not open that settings screen on this phone. Use App info › Battery instead.', 'error');
  };

  return (
    <Screen scroll edges={[]}>
      <View style={{ marginBottom: space.xl }}>
        {allGood ? (
          <Banner
            tone="info"
            icon="shield-checkmark-outline"
            title="Background protection looks good"
            message="Android allows NotiCatch to keep running. Also complete the phone-specific steps below. Some phones need them even when everything here is green."
          />
        ) : (
          <Banner
            icon="warning-outline"
            title="Your phone may stop NotiCatch"
            message="Many phones close background apps to save battery. While NotiCatch is stopped, new and deleted messages are NOT saved. Fix the items marked in red."
          />
        )}
      </View>

      <Group title="STATUS">
        <Row
          icon="notifications-outline"
          title="Notification access"
          subtitle={granted ? 'Allowed' : 'Off: nothing can be saved'}
          right={<StatusIcon ok={granted} />}
          onPress={granted ? undefined : () => void openAccessSettings()}
        />
        <Row
          icon="pulse-outline"
          title="Listener running"
          subtitle={
            status?.listenerConnected
              ? status.lastCapturedAt
                ? `Last saved ${formatRelative(status.lastCapturedAt)}${stale ? ' (a while ago, check battery settings)' : ''}`
                : 'Waiting for the first notification'
              : 'Stopped by the system. Tap to restart'
          }
          right={<StatusIcon ok={!!status?.listenerConnected && !stale} />}
          onPress={
            status?.listenerConnected
              ? undefined
              : () => {
                  void requestRebind().then(() => setTimeout(refresh, 1500));
                }
          }
        />
        <Row
          icon="battery-charging-outline"
          title="Battery optimization"
          subtitle={status?.batteryUnrestricted ? 'Unrestricted' : 'Optimized: tap and choose "Don\'t optimize" / "Unrestricted"'}
          right={<StatusIcon ok={!!status?.batteryUnrestricted} />}
          onPress={() => void open(openBatterySettings)}
          last
        />
      </Group>

      <Group title={`${brand.name.toUpperCase()} STEPS`} footer="Phone makers name these settings differently, and Android does not tell apps whether they are on. Please check them once by hand.">
        <View style={{ padding: space.lg, gap: space.sm }}>
          {brand.steps.map((step, i) => (
            <View key={step} style={{ flexDirection: 'row', gap: space.sm }}>
              <Text variant="bodyStrong" color={colors.primary}>{i + 1}.</Text>
              <Text style={{ flex: 1 }}>{step}</Text>
            </View>
          ))}
        </View>
        <Row
          icon="rocket-outline"
          title={status?.hasAutostartScreen ? 'Open Autostart settings' : 'Open App info'}
          chevron
          onPress={() => void open(openAutostartSettings)}
          last
        />
      </Group>

      <Group title="TEST">
        <Row
          icon="paper-plane-outline"
          title="Send test notification"
          subtitle="It should appear in NotiCatch within a few seconds"
          chevron
          last
          onPress={async () => {
            const ok = await postTestNotification();
            showAppToast(ok ? 'Test notification sent' : 'Could not post test notification', ok ? 'success' : 'error');
            setTimeout(refresh, 1500);
          }}
        />
      </Group>
    </Screen>
  );
}
