import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { BackHandler, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { isValidPin } from '@/lib/pin';
import { useSecurity } from '@/store/security';
import { useSettings } from '@/store/settings';
import { radius, space, useTheme } from '@/theme';
import { PinDots, PinPad } from './PinPad';
import { Button, Text } from './ui';

export function LockScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const { colors } = useTheme();
  const biometricEnabled = useSettings((s) => s.biometricEnabled);
  const biometricAvailable = useSecurity((s) => s.biometricAvailable);
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [retryAt, setRetryAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);

  const canBio = biometricEnabled && biometricAvailable;
  const remaining = Math.max(0, retryAt - now);

  // The lock must not be bypassable with the hardware back button.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    void useSecurity.getState().lockoutRemaining().then((ms) => ms > 0 && setRetryAt(Date.now() + ms));
  }, []);

  useEffect(() => {
    if (remaining <= 0) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [remaining]);

  const bio = useCallback(async () => {
    await useSecurity.getState().unlockWithBiometrics();
  }, []);

  useEffect(() => {
    if (canBio) void bio();
  }, [canBio, bio]);

  const submit = async () => {
    if (busy || remaining > 0) return;
    if (!isValidPin(pin)) { setMessage('Enter your 4 to 8 digit PIN.'); return; }
    setBusy(true);
    const res = await useSecurity.getState().verifyPin(pin);
    setBusy(false);
    setPin('');
    if (res.ok) return;
    if (res.reason === 'locked' && res.retryAt) { setRetryAt(res.retryAt); setNow(Date.now()); setMessage('Too many attempts.'); }
    else setMessage(res.attemptsLeft !== undefined && res.attemptsLeft <= 2 ? `Wrong PIN. ${res.attemptsLeft} attempt${res.attemptsLeft === 1 ? '' : 's'} left before a delay.` : 'Wrong PIN. Try again.');
  };

  return (
    <SafeAreaView
      edges={[]}
      style={[
        { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: colors.bg, zIndex: 100 },
        { paddingTop: top, paddingBottom: bottom },
      ]}
      accessibilityViewIsModal
    >
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.xl, padding: space.xl }}>
        <View style={{ width: 72, height: 72, borderRadius: radius.xl, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="lock-closed" size={32} color={colors.onPrimary} />
        </View>
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Text variant="title" accessibilityRole="header">NotiCatch is locked</Text>
          <Text muted>Enter your PIN to continue</Text>
        </View>
        <PinDots length={pin.length} />
        <View style={{ minHeight: 40, justifyContent: 'center' }} accessibilityLiveRegion="polite">
          {remaining > 0 ? (
            <Text color={colors.danger} style={{ textAlign: 'center' }}>Locked for {Math.ceil(remaining / 1000)}s</Text>
          ) : message ? <Text color={colors.danger} style={{ textAlign: 'center' }}>{message}</Text> : null}
        </View>
        <PinPad value={pin} onChange={(v) => { setPin(v); setMessage(null); }} onSubmit={() => void submit()} disabled={busy || remaining > 0} submitLabel="Unlock" />
        {canBio ? <Button title="Use biometrics" kind="ghost" icon="finger-print" onPress={() => void bio()} /> : null}
      </View>
    </SafeAreaView>
  );
}
