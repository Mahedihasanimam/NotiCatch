import { Screen } from '@/components/Screen';
import { Text } from '@/components/ui';
import { PRIVACY_POLICY } from '@/lib/privacyPolicy';
import { space } from '@/theme';

export default function Privacy() {
  return (
    <Screen scroll edges={[]}>
      <Text variant="title" accessibilityRole="header">{PRIVACY_POLICY.title}</Text>
      <Text variant="caption" muted style={{ marginBottom: space.lg }}>Last updated {PRIVACY_POLICY.updated}</Text>
      {PRIVACY_POLICY.sections.map((s) => (
        <Text key={s.heading} style={{ marginBottom: space.lg }} selectable>
          <Text variant="heading">{s.heading}{'\n'}</Text>
          {s.body}
        </Text>
      ))}
    </Screen>
  );
}
