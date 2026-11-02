import { useState } from 'react';
import { View } from 'react-native';
import { showAppToast } from '@/components/CustomDialog';
import { PinDots, PinPad } from '@/components/PinPad';
import { Screen } from '@/components/Screen';
import { Sheet } from '@/components/Sheet';
import { Banner } from '@/components/states';
import { Button, Group, Row, Text, ToggleRow } from '@/components/ui';
import { isValidPin } from '@/lib/pin';
import { useSecurity } from '@/store/security';
import { useSettings } from '@/store/settings';
import { space, useTheme } from '@/theme';

type Mode = 'set' | 'change' | 'remove';
type Step = 'current' | 'new' | 'confirm';

const DELAYS = [{ ms: 0, label: 'Immediately' }, { ms: 30_000, label: 'After 30 seconds' }, { ms: 60_000, label: 'After 1 minute' }, { ms: 300_000, label: 'After 5 minutes' }];

function PinFlow({ mode, onClose }: { mode: Mode; onClose: () => void }) {
  const { colors } = useTheme();
  const [step, setStep] = useState<Step>(mode === 'set' ? 'new' : 'current');
  const [pin, setPin] = useState('');
  const [first, setFirst] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const titles: Record<Step, string> = { current: 'Enter your current PIN', new: 'Choose a new PIN (4–8 digits)', confirm: 'Repeat the new PIN' };

  const submit = async () => {
    setError(null);
    if (busy) return;
    setBusy(true);
    try {
      if (step === 'current') {
        const res = await useSecurity.getState().verifyPin(pin);
        if (!res.ok) { setError(res.reason === 'locked' ? 'Too many attempts. Try again later.' : 'That PIN is not correct.'); return; }
        // verifyPin unlocks; harmless here since we are already inside the app.
        if (mode === 'remove') { await useSecurity.getState().removePin(); onClose(); return; }
        setPin(''); setStep('new'); return;
      }
      if (step === 'new') {
        if (!isValidPin(pin)) { setError('Use 4 to 8 digits.'); return; }
        setFirst(pin); setPin(''); setStep('confirm'); return;
      }
      if (pin !== first) { setError('The PINs do not match. Start again.'); setPin(''); setFirst(''); setStep('new'); return; }
      await useSecurity.getState().setPin(pin);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
      setPin('');
    }
  };

  return (
    <View style={{ alignItems: 'center', gap: space.lg, paddingHorizontal: space.lg, paddingBottom: space.lg }}>
      <Text variant="bodyStrong" accessibilityLiveRegion="polite">{mode === 'remove' ? 'Enter your PIN to turn the lock off' : titles[step]}</Text>
      <PinDots length={pin.length} />
      <View style={{ minHeight: 22 }}>{error ? <Text color={colors.danger} accessibilityLiveRegion="polite">{error}</Text> : null}</View>
      <PinPad value={pin} onChange={setPin} onSubmit={() => void submit()} disabled={busy} submitLabel="Continue" />
    </View>
  );
}

export default function Security() {
  const { colors } = useTheme();
  const s = useSettings();
  const hasPin = useSecurity((x) => x.hasPin);
  const bioAvailable = useSecurity((x) => x.biometricAvailable);
  const [flow, setFlow] = useState<Mode | null>(null);

  const toggleBio = async (on: boolean) => {
    if (!on) { s.update({ biometricEnabled: false }); return; }
    const ok = await useSecurity.getState().checkBiometrics();
    if (!ok) { showAppToast('Set up a fingerprint or face unlock in Android settings first.', 'error'); return; }
    s.update({ biometricEnabled: true });
  };

  return (
    <Screen scroll edges={[]}>
      <View style={{ marginBottom: space.xl }}>
        <Banner tone="info" icon="lock-closed-outline" title="Your PIN never leaves this device" message="It is stored as a salted hash in Android’s hardware-backed keystore. If you forget it, the only way back in is to clear the app’s data, which erases saved notifications." />
      </View>

      <Group title="App lock">
        {hasPin ? (
          <>
            <Row icon="key-outline" title="Change PIN" chevron onPress={() => setFlow('change')} />
            <Row icon="close-circle-outline" title="Turn off PIN lock" danger last onPress={() => setFlow('remove')} />
          </>
        ) : (
          <Row icon="key-outline" title="Set a PIN" subtitle="Lock NotiCatch whenever you leave it" chevron last onPress={() => setFlow('set')} />
        )}
      </Group>

      {hasPin ? (
        <>
          <Group title="Unlock" footer={bioAvailable ? 'Biometrics are a shortcut. The PIN always works as a fallback.' : 'No fingerprint or face unlock is enrolled on this device.'}>
            <ToggleRow icon="finger-print-outline" title="Use biometrics" value={s.biometricEnabled && bioAvailable} disabled={!bioAvailable} onValueChange={(v) => void toggleBio(v)} last />
          </Group>
          <Group title="Lock the app" footer="NotiCatch locks when you switch away for longer than this.">
            {DELAYS.map((d, i) => (
              <Row key={d.ms} title={d.label} last={i === DELAYS.length - 1} onPress={() => s.update({ lockDelayMs: d.ms })} right={<Text color={s.lockDelayMs === d.ms ? colors.primary : 'transparent'} variant="bodyStrong">✓</Text>} />
            ))}
          </Group>
        </>
      ) : null}

      <Group title="Screen privacy" footer="Blocks screenshots and hides NotiCatch’s content in the recent-apps view.">
        <ToggleRow icon="eye-off-outline" title="Hide content from screenshots" value={s.secureScreen} onValueChange={(v) => s.update({ secureScreen: v })} last />
      </Group>

      <Sheet visible={flow !== null} title={flow === 'set' ? 'Set a PIN' : flow === 'change' ? 'Change PIN' : 'Turn off lock'} onClose={() => setFlow(null)} maxHeight="95%">
        {flow ? <PinFlow key={flow} mode={flow} onClose={() => setFlow(null)} /> : null}
      </Sheet>
    </Screen>
  );
}
