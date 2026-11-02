import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator, Pressable, Switch, Text as RNText, View, type StyleProp, type TextProps, type TextStyle, type ViewStyle,
} from 'react-native';
import { PressableBounce } from './PressableBounce';
import { fonts, MIN_TOUCH, radius, space, typeScale, useTheme, type TextVariant } from '@/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

// ---------------------------------------------------------------- Text
interface AppTextProps extends TextProps {
  variant?: TextVariant;
  muted?: boolean;
  color?: string;
}

export function Text({ variant = 'body', muted, color, style, ...rest }: AppTextProps) {
  const { colors } = useTheme();
  return (
    <RNText
      maxFontSizeMultiplier={1.5}
      {...rest}
      style={[typeScale[variant], { color: color ?? (muted ? colors.textMuted : colors.text) }, style]}
    />
  );
}

// ---------------------------------------------------------------- Card
export function Card({ children, style, padded = true }: { children: ReactNode; style?: StyleProp<ViewStyle>; padded?: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
        padded && { padding: space.lg },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ---------------------------------------------------------------- Button
type ButtonKind = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  kind?: ButtonKind;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

export function Button({ title, onPress, kind = 'primary', icon, loading, disabled, style, accessibilityHint }: ButtonProps) {
  const { colors } = useTheme();
  const palette: Record<ButtonKind, { bg: string; fg: string; border: string }> = {
    primary: { bg: colors.primary, fg: colors.onPrimary, border: colors.primary },
    secondary: { bg: colors.surface, fg: colors.primary, border: colors.border },
    danger: { bg: colors.dangerSoft, fg: colors.danger, border: colors.dangerSoft },
    ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent' },
  };
  const p = palette[kind];
  const off = disabled || loading;
  return (
    <PressableBounce
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      disabled={off}
      onPress={onPress}
      scaleTo={0.96}
      activeOpacity={0.88}
      style={[
        {
          minHeight: MIN_TOUCH + 4, paddingHorizontal: space.xl, borderRadius: radius.pill, flexDirection: 'row',
          alignItems: 'center', justifyContent: 'center', gap: space.sm, backgroundColor: p.bg, borderWidth: 1,
          borderColor: p.border, opacity: off ? 0.55 : 1,
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={p.fg} /> : icon ? <Ionicons name={icon} size={20} color={p.fg} /> : null}
      <Text variant="bodyStrong" color={p.fg}>{title}</Text>
    </PressableBounce>
  );
}

// ---------------------------------------------------------------- IconButton
export function IconButton({ icon, label, onPress, color, active, disabled }: { icon: IconName; label: string; onPress: () => void; color?: string; active?: boolean; disabled?: boolean }) {
    const { colors } = useTheme();
    return (
      <PressableBounce
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected: active, disabled }}
        disabled={disabled}
        hitSlop={4}
        onPress={onPress}
        scaleTo={0.88}
        style={{
          width: MIN_TOUCH, height: MIN_TOUCH, borderRadius: MIN_TOUCH / 2, alignItems: 'center', justifyContent: 'center',
          backgroundColor: active ? colors.primarySoft : 'transparent', opacity: disabled ? 0.4 : 1,
        }}
      >
        <Ionicons name={icon} size={22} color={color ?? (active ? colors.primary : colors.text)} />
      </PressableBounce>
    );
}

// ---------------------------------------------------------------- Chip
export function Chip({ label, selected, onPress, icon, onClear }: { label: string; selected?: boolean; onPress: () => void; icon?: IconName; onClear?: () => void }) {
  const { colors } = useTheme();
  const fg = selected ? colors.onPrimary : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={selected && onClear ? `${label}, active filter` : label}
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      android_ripple={{ color: colors.primarySoft }}
      style={{
        minHeight: 40, paddingHorizontal: space.md + 2, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center',
        gap: 6, backgroundColor: selected ? colors.primary : colors.surface, borderWidth: 1,
        borderColor: selected ? colors.primary : colors.border,
      }}
    >
      {icon ? <Ionicons name={icon} size={16} color={fg} /> : null}
      <Text variant="label" color={fg}>{label}</Text>
      {selected && onClear ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`Clear ${label}`} hitSlop={10} onPress={onClear}>
          <Ionicons name="close-circle" size={17} color={fg} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

// ---------------------------------------------------------------- Rows
interface RowProps {
  icon?: IconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: ReactNode;
  danger?: boolean;
  chevron?: boolean;
  last?: boolean;
}

export function Row({ icon, title, subtitle, onPress, right, danger, chevron, last }: RowProps) {
  const { colors } = useTheme();
  const tint = danger ? colors.danger : colors.primary;
  const body = (
    <View
      style={{
        minHeight: 60, paddingVertical: space.md, paddingHorizontal: space.lg, flexDirection: 'row', alignItems: 'center', gap: space.md,
        borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.border,
      }}
    >
      {icon ? (
        <View style={{ width: 36, height: 36, borderRadius: radius.md, backgroundColor: danger ? colors.dangerSoft : colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon} size={19} color={tint} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" color={danger ? colors.danger : undefined}>{title}</Text>
        {subtitle ? <Text variant="caption" muted style={{ marginTop: 2 }}>{subtitle}</Text> : null}
      </View>
      {right}
      {chevron ? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} /> : null}
    </View>
  );
  if (!onPress) return body;
  return (
    <PressableBounce
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      onPress={onPress}
      scaleTo={0.98}
    >
      {body}
    </PressableBounce>
  );
}

export function ToggleRow({ icon, title, subtitle, value, onValueChange, last, disabled }: { icon?: IconName; title: string; subtitle?: string; value: boolean; onValueChange: (v: boolean) => void; last?: boolean; disabled?: boolean }) {
  const { colors } = useTheme();
  return (
    <View accessible accessibilityRole="switch" accessibilityLabel={title} accessibilityHint={subtitle} accessibilityState={{ checked: value, disabled }} accessibilityActions={[{ name: 'activate' }]} onAccessibilityAction={() => !disabled && onValueChange(!value)}>
      <Row
        icon={icon} title={title} subtitle={subtitle} last={last}
        right={
          <Switch
            value={value} onValueChange={onValueChange} disabled={disabled}
            trackColor={{ false: colors.surfaceAlt, true: colors.primary }}
            thumbColor={value ? colors.onPrimary : colors.textMuted}
            accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
          />
        }
      />
    </View>
  );
}

export function Group({ title, children, footer }: { title?: string; children: ReactNode; footer?: string }) {
  return (
    <View style={{ marginBottom: space.xl }}>
      {title ? <Text variant="label" muted style={{ marginBottom: space.sm, marginLeft: space.xs }} accessibilityRole="header">{title}</Text> : null}
      <Card padded={false} style={{ overflow: 'hidden' }}>{children}</Card>
      {footer ? <Text variant="caption" muted style={{ marginTop: space.sm, marginHorizontal: space.xs }}>{footer}</Text> : null}
    </View>
  );
}

// ---------------------------------------------------------------- Segmented
export function Segmented<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  const { colors } = useTheme();
  return (
    <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, padding: 4 }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={o.label}
            onPress={() => onChange(o.value)}
            style={{ flex: 1, minHeight: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? colors.surface : 'transparent' }}
          >
            <Text variant="label" color={on ? colors.primary : colors.textMuted} style={{ fontFamily: on ? fonts.bold : fonts.medium }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export type { TextStyle };
