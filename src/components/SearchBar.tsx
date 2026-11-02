import { Ionicons } from '@expo/vector-icons';
import { Pressable, TextInput, View } from 'react-native';
import { fonts, MIN_TOUCH, radius, space, useTheme } from '@/theme';

export function SearchBar({ value, onChangeText, placeholder, autoFocus }: { value: string; onChangeText: (t: string) => void; placeholder: string; autoFocus?: boolean }) {
    const { colors } = useTheme();
    return (
      <View style={{ minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, paddingLeft: space.lg }}>
        <Ionicons name="search" size={19} color={colors.textMuted} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          autoFocus={autoFocus}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          accessibilityLabel={placeholder}
          style={{ flex: 1, minHeight: MIN_TOUCH, paddingHorizontal: space.md, color: colors.text, fontFamily: fonts.regular, fontSize: 15 }}
        />
        {value ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => onChangeText('')} hitSlop={8} style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
    );
}
