import type { ReactNode } from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { space, useTheme } from '@/theme';
import { IconButton, Text, type IconName } from './ui';

export function Screen({
  children,
  scroll,
  edges = ['top'],
  contentStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const { top, bottom, left, right } = useSafeAreaInsets();

  const edgePadding = {
    paddingTop: edges.includes('top') ? top : 0,
    paddingBottom: edges.includes('bottom') ? bottom : 0,
    paddingLeft: edges.includes('left') ? left : 0,
    paddingRight: edges.includes('right') ? right : 0,
  };

  return (
    <SafeAreaView
      edges={[]}
      style={[
        { flex: 1, backgroundColor: colors.bg },
        edgePadding,
      ]}
    >
      {scroll ? (
        <ScrollView contentContainerStyle={[{ padding: space.lg, paddingBottom: space.xxl * 2 }, contentStyle]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  actions,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  actions?: { icon: IconName; label: string; onPress: () => void; active?: boolean }[];
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.sm }}>
      {onBack ? (
        <View style={{ marginRight: space.sm }}>
          <IconButton icon="arrow-back" label="Back" onPress={onBack} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text variant="display" accessibilityRole="header">{title}</Text>
        {subtitle ? <Text variant="label" muted>{subtitle}</Text> : null}
      </View>
      {actions?.map((a) => <IconButton key={a.label} icon={a.icon} label={a.label} onPress={a.onPress} active={a.active} />)}
    </View>
  );
}
