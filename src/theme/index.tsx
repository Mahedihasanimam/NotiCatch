import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { useSettings } from '@/store/settings';

export interface Palette {
  bg: string; surface: string; surfaceAlt: string; text: string; textMuted: string; border: string;
  primary: string; onPrimary: string; primarySoft: string; accent: string; danger: string; dangerSoft: string;
  success: string; overlay: string; chartBar: string;
}

/** Marine teal for structure, marigold reserved for "kept" things (favourites, today's marker). */
export const lightPalette: Palette = {
  bg: '#EEF2F4', surface: '#FFFFFF', surfaceAlt: '#E3EAEE', text: '#0F1A20', textMuted: '#52636D', border: '#D3DCE1',
  primary: '#0A6C74', onPrimary: '#FFFFFF', primarySoft: '#D5ECEE', accent: '#B87400', danger: '#B3261E', dangerSoft: '#F9DEDC',
  success: '#1B7A52', overlay: 'rgba(8,16,20,0.5)', chartBar: '#B9D3D7',
};

export const darkPalette: Palette = {
  bg: '#232630', surface: '#2E323F', surfaceAlt: '#363A49', text: '#FFFFFF', textMuted: '#7C8494', border: '#323746',
  primary: '#0A6C74', onPrimary: '#FFFFFF', primarySoft: '#123D42', accent: '#FFC107', danger: '#EF4444', dangerSoft: '#4A2228',
  success: '#10B981', overlay: 'rgba(0,0,0,0.7)', chartBar: '#0A6C74',
};

export const fonts = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  heavy: 'Manrope_800ExtraBold',
} as const;

export type TextVariant = 'display' | 'title' | 'heading' | 'body' | 'bodyStrong' | 'label' | 'caption';

export const typeScale: Record<TextVariant, { fontFamily: string; fontSize: number; lineHeight: number; letterSpacing?: number }> = {
  display: { fontFamily: fonts.heavy, fontSize: 32, lineHeight: 38, letterSpacing: -0.6 },
  title: { fontFamily: fonts.heavy, fontSize: 22, lineHeight: 28, letterSpacing: -0.3 },
  heading: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 24 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.medium, fontSize: 12.5, lineHeight: 17 },
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 18, xl: 26, pill: 999 } as const;
export const MIN_TOUCH = 48;

export interface Theme {
  colors: Palette;
  isDark: boolean;
}

const ThemeContext = createContext<Theme>({ colors: lightPalette, isDark: false });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const pref = useSettings((s) => s.theme);
  const system = useColorScheme();
  const isDark = pref === 'dark' || (pref === 'system' && system === 'dark');
  const value = useMemo<Theme>(() => ({ colors: isDark ? darkPalette : lightPalette, isDark }), [isDark]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = (): Theme => useContext(ThemeContext);
