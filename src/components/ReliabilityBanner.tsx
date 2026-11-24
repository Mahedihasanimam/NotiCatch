import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState, View } from 'react-native';
import { PressableBounce } from '@/components/PressableBounce';
import { Text } from '@/components/ui';
import { type ReliabilityStatus, getReliabilityStatus } from '@/data/repository';
import { useAccess } from '@/store/access';
import { useDataVersion } from '@/store/dataVersion';

const BRAND_NAMES: Partial<Record<ReliabilityStatus['brand'], string>> = {
  xiaomi: 'Xiaomi / Redmi',
  samsung: 'Samsung',
  oppo: 'OPPO / Realme',
  vivo: 'vivo',
  huawei: 'Huawei / Honor',
  transsion: 'Infinix / TECNO',
};

/**
 * Home-screen warning shown while access is granted but Android may stop (or has stopped) the
 * listener. Phone makers popular in Bangladesh kill background apps aggressively, and users only
 * notice when messages are missing — so tell them up front and link to the fix.
 */
export function ReliabilityBanner() {
  const granted = useAccess((s) => s.granted);
  const version = useDataVersion((s) => s.version);
  const [status, setStatus] = useState<ReliabilityStatus | null>(null);

  const refresh = useCallback(() => {
    void getReliabilityStatus().then(setStatus);
  }, []);

  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh, version]);

  if (!granted || !status) return null;

  const stopped = !status.listenerConnected;
  if (!stopped && status.batteryUnrestricted) return null;

  const phone = BRAND_NAMES[status.brand] ?? 'Your phone';
  const color = stopped ? '#EF4444' : '#F59E0B';
  const title = stopped ? 'Saving has stopped' : 'Some notifications may be missed';
  const message = stopped
    ? `${phone} stopped NotiCatch in the background, so new notifications are not being saved. Fix the settings so it doesn't happen again.`
    : `${phone} can stop NotiCatch in the background to save battery. Allow it to run (takes 1 minute) so every notification is saved.`;

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginBottom: 12,
        backgroundColor: stopped ? '#3A1515' : '#352912',
        borderWidth: 1,
        borderColor: color,
        borderRadius: 14,
        padding: 14,
        gap: 10,
      }}
      accessibilityRole="alert"
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Ionicons name={stopped ? 'alert-circle' : 'battery-half'} size={20} color={color} />
        <Text style={{ color, fontFamily: 'Manrope_700Bold', fontSize: 14 }}>{title}</Text>
      </View>
      <Text style={{ color: '#D1D5DB', fontSize: 12.5, lineHeight: 18 }}>{message}</Text>
      <PressableBounce
        onPress={() => router.push('/settings/reliability' as never)}
        style={{ backgroundColor: color, paddingVertical: 9, borderRadius: 8, alignItems: 'center' }}
      >
        <Text style={{ color: '#1F1604', fontFamily: 'Manrope_700Bold', fontSize: 13 }}>Fix now</Text>
      </PressableBounce>
    </View>
  );
}
