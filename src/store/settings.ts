import KV from 'expo-sqlite/kv-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { GroupMode, ThemePreference } from '@/lib/types';

export interface SettingsData {
  onboarded: boolean;
  theme: ThemePreference;
  groupMode: GroupMode;
  captureEnabled: boolean;
  captureOngoing: boolean;
  skipGroupSummary: boolean;
  /** null = never delete automatically */
  retentionDays: number | null;
  keepFavorites: boolean;
  keepArchived: boolean;
  excludedPackages: string[];
  lockEnabled: boolean;
  biometricEnabled: boolean;
  /** How long the app may stay in the background before it locks. 0 = immediately. */
  lockDelayMs: number;
  secureScreen: boolean;
  isPro: boolean;
  trialStartedAt: number | null;
  statusBarNotification: boolean;
}

export interface SettingsState extends SettingsData {
  update: (patch: Partial<SettingsData>) => void;
  setExcluded: (packages: string[]) => void;
  toggleExcluded: (packageName: string) => void;
  setPro: (isPro: boolean) => void;
  reset: () => void;
}

export const DEFAULT_SETTINGS: SettingsData = {
  onboarded: false,
  theme: 'dark',
  groupMode: 'date',
  captureEnabled: true,
  captureOngoing: false,
  skipGroupSummary: true,
  retentionDays: null,
  keepFavorites: true,
  keepArchived: true,
  excludedPackages: [],
  lockEnabled: false,
  biometricEnabled: false,
  lockDelayMs: 0,
  secureScreen: false,
  isPro: false,
  trialStartedAt: null,
  statusBarNotification: true,
};

const kvStorage = createJSONStorage(() => ({
  getItem: (k: string) => {
    try {
      return KV.getItemSync(k);
    } catch (e) {
      console.warn('kvStorage.getItemSync failed:', e);
      return null;
    }
  },
  setItem: (k: string, v: string) => {
    try {
      KV.setItemSync(k, v);
    } catch (e) {
      console.warn('kvStorage.setItemSync failed:', e);
    }
  },
  removeItem: (k: string) => {
    try {
      KV.removeItemSync(k);
    } catch (e) {
      console.warn('kvStorage.removeItemSync failed:', e);
    }
  },
}));

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      update: (patch) => set(patch),
      setExcluded: (packages) => set({ excludedPackages: [...new Set(packages)] }),
      toggleExcluded: (packageName) =>
        set((s) => ({
          excludedPackages: s.excludedPackages.includes(packageName)
            ? s.excludedPackages.filter((p) => p !== packageName)
            : [...s.excludedPackages, packageName],
        })),
      setPro: (isPro) => set({ isPro, trialStartedAt: isPro ? Date.now() : null }),
      reset: () => set({ ...DEFAULT_SETTINGS, onboarded: true }),
    }),
    {
      name: 'keepsake.settings',
      version: 1,
      storage: kvStorage,
      // Merge so settings added in later versions get defaults for existing installs.
      merge: (persisted, current) => ({ ...current, ...(persisted as Partial<SettingsState>) }),
      partialize: (s): SettingsData => ({
        onboarded: s.onboarded, theme: s.theme, groupMode: s.groupMode, captureEnabled: s.captureEnabled,
        captureOngoing: s.captureOngoing, skipGroupSummary: s.skipGroupSummary, retentionDays: s.retentionDays,
        keepFavorites: s.keepFavorites, keepArchived: s.keepArchived, excludedPackages: s.excludedPackages,
        lockEnabled: s.lockEnabled, biometricEnabled: s.biometricEnabled, lockDelayMs: s.lockDelayMs,
        secureScreen: s.secureScreen, isPro: s.isPro, trialStartedAt: s.trialStartedAt,
        statusBarNotification: s.statusBarNotification,
      }),
    },
  ),
);

export function toCaptureConfig(s: SettingsData) {
  return {
    captureEnabled: s.captureEnabled,
    captureOngoing: s.captureOngoing,
    skipGroupSummary: s.skipGroupSummary,
    retentionDays: s.retentionDays ?? 0,
    keepFavorites: s.keepFavorites,
    keepArchived: s.keepArchived,
    excludedPackages: s.excludedPackages,
    statusBarNotification: s.statusBarNotification,
  };
}
