import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { AppState, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Banner } from '@/components/states';
import { Button, Card, Text, type IconName } from '@/components/ui';
import { openAccessSettings, openAppSettings } from '@/data/repository';
import { useAccess } from '@/store/access';
import { useSettings } from '@/store/settings';
import { radius, space, useTheme } from '@/theme';

const POINTS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'time-outline', title: 'Read what you missed', body: 'Dismissed or cleared notifications stay in your history.' },
  { icon: 'phone-portrait-outline', title: 'Stays on this device', body: 'No account, no servers, no internet permission in the release app.' },
  { icon: 'options-outline', title: 'You stay in control', body: 'Pick the apps, set automatic cleanup, lock it with a PIN.' },
];

export default function Onboarding() {
  const { colors } = useTheme();
  const finish = useSettings((s) => s.update);
  const granted = useAccess((s) => s.granted);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step !== 2) return;
    const sub = AppState.addEventListener('change', (st) => st === 'active' && void useAccess.getState().refresh());
    return () => sub.remove();
  }, [step]);

  const done = () => finish({ onboarded: true });

  return (
    <Screen scroll edges={['top', 'bottom']} contentStyle={{ flexGrow: 1, justifyContent: 'space-between', gap: space.xl }}>
      <View style={{ gap: space.lg, paddingTop: space.xl }}>
        <View style={{ width: 64, height: 64, borderRadius: radius.lg, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={step === 0 ? 'notifications' : step === 1 ? 'shield-checkmark' : 'key'} size={30} color={colors.onPrimary} />
        </View>

        {step === 0 ? (
          <>
            <Text variant="display" accessibilityRole="header">Never lose a notification again</Text>
            <Text muted>NotiCatch keeps a searchable history of the notifications your phone shows.</Text>
            {POINTS.map((p) => (
              <View key={p.title} style={{ flexDirection: 'row', gap: space.md, alignItems: 'flex-start' }}>
                <Ionicons name={p.icon} size={24} color={colors.primary} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}><Text variant="bodyStrong">{p.title}</Text><Text muted>{p.body}</Text></View>
              </View>
            ))}
          </>
        ) : null}

        {step === 1 ? (
          <>
            <Text variant="display" accessibilityRole="header">What you’re agreeing to</Text>
            <Card style={{ gap: space.md }}>
              <Text variant="bodyStrong">NotiCatch will be able to read the content of notifications from all apps you haven’t excluded</Text>
              <Text muted>That includes messages, email previews, banking alerts and one-time codes. It uses this only to save them in a private database on this device.</Text>
              <Text muted>Nothing is uploaded or shared. You can pause, exclude apps, delete history or revoke access whenever you like.</Text>
              <Text muted>Android limits what apps can see: hidden or redacted notifications can’t be saved, and anything posted before access is on can’t be recovered.</Text>
            </Card>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Text variant="display" accessibilityRole="header">Turn on notification access</Text>
            <Text muted>Android will open a settings screen. Find NotiCatch in the list and switch it on.</Text>
            {granted ? (
              <Banner tone="info" icon="checkmark-circle-outline" title="Access granted" message="NotiCatch will now save new notifications." />
            ) : (
              <>
                <Button title="Open notification access" icon="open-outline" onPress={() => void openAccessSettings()} />
                <Card style={{ gap: space.sm }}>
                  <Text variant="bodyStrong">Switch is greyed out?</Text>
                  <Text muted>If you installed NotiCatch from a file, Android may block it at first. Open App info, tap ⋮ and choose “Allow restricted settings”.</Text>
                  <Button title="Open App info" kind="secondary" onPress={() => void openAppSettings()} />
                </Card>
              </>
            )}
          </>
        ) : null}
      </View>

      <View style={{ gap: space.md }}>
        <View accessible accessibilityLabel={`Step ${step + 1} of 3`} style={{ flexDirection: 'row', gap: 6, justifyContent: 'center' }}>
          {[0, 1, 2].map((i) => <View key={i} style={{ width: i === step ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: i === step ? colors.primary : colors.border }} />)}
        </View>
        {step < 2 ? (
          <Button title={step === 0 ? 'Continue' : 'I understand'} onPress={() => setStep(step + 1)} />
        ) : (
          <>
            <Button title={granted ? 'Start using NotiCatch' : 'Check again'} onPress={() => (granted ? done() : void useAccess.getState().refresh())} />
            {!granted ? <Button title="Skip for now" kind="ghost" onPress={done} /> : null}
          </>
        )}
        {step > 0 ? <Button title="Back" kind="ghost" onPress={() => setStep(step - 1)} /> : null}
      </View>
    </Screen>
  );
}
