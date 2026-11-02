import { AppState } from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';
import { configureCapture, runCleanup } from './repository';
import { useAccess } from '@/store/access';
import { useDataVersion } from '@/store/dataVersion';
import { useSecurity } from '@/store/security';
import { toCaptureConfig, useSettings, type SettingsData } from '@/store/settings';

const CAPTURE_KEYS: (keyof SettingsData)[] = [
  'captureEnabled', 'captureOngoing', 'skipGroupSummary', 'retentionDays', 'keepFavorites', 'keepArchived', 'excludedPackages',
];

/** Mirrors capture-related settings into the native layer so the service honours them without the UI. */
export function startNativeSync(): () => void {
  const push = () => { void configureCapture(toCaptureConfig(useSettings.getState())).catch(() => undefined); };
  push();
  return useSettings.subscribe((state, prev) => {
    if (CAPTURE_KEYS.some((k) => state[k] !== prev[k])) push();
  });
}

export async function runRetentionCleanup(): Promise<number> {
  const s = useSettings.getState();
  try {
    const n = await runCleanup(s.retentionDays, s.keepFavorites, s.keepArchived);
    if (n > 0) useDataVersion.getState().bump();
    return n;
  } catch {
    return 0;
  }
}

/** Auto-lock, permission re-check and retention cleanup on foreground transitions. */
export function startAppStateHandling(): () => void {
  let leftAt: number | null = null;
  const sub = AppState.addEventListener('change', (next) => {
    const security = useSecurity.getState();
    if (security.authBusy) return; // system prompts pause the activity; not a real exit
    if (next === 'background' || next === 'inactive') {
      if (leftAt === null) leftAt = Date.now();
      if (useSettings.getState().lockDelayMs === 0) security.lock();
      return;
    }
    // active
    const away = leftAt === null ? 0 : Date.now() - leftAt;
    leftAt = null;
    if (away >= useSettings.getState().lockDelayMs) security.lock();
    void useAccess.getState().refresh();
    void runRetentionCleanup();
  });
  return () => sub.remove();
}

/** Blocks screenshots and hides content in the recent-apps switcher when enabled. */
export function startSecureScreenSync(): () => void {
  const apply = (on: boolean) => {
    const op = on ? ScreenCapture.preventScreenCaptureAsync('keepsake') : ScreenCapture.allowScreenCaptureAsync('keepsake');
    void op.catch(() => undefined);
  };
  apply(useSettings.getState().secureScreen);
  return useSettings.subscribe((s, p) => {
    if (s.secureScreen !== p.secureScreen) apply(s.secureScreen);
  });
}
