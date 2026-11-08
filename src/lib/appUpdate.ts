import Constants from 'expo-constants';
import { Linking } from 'react-native';
import { create } from 'zustand';

export const CURRENT_APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
export const PLAY_STORE_PACKAGE = 'com.mehedihasan.noticatch.app';
export const PLAY_STORE_MARKET_URL = `market://details?id=${PLAY_STORE_PACKAGE}`;
export const PLAY_STORE_WEB_URL = `https://play.google.com/store/apps/details?id=${PLAY_STORE_PACKAGE}`;

// Remote version endpoint (hosted in your GitHub repo)
export const REMOTE_VERSION_URL =
  'https://raw.githubusercontent.com/Mahedihasanimam/NotiCatch/main/version.json';

export interface UpdateInfo {
  latestVersion: string;
  versionCode?: number;
  forceUpdate?: boolean;
  title?: string;
  message?: string;
  releaseNotes?: string;
  playStoreUrl?: string;
  fallbackUrl?: string;
}

export interface UpdateCheckResult {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  updateInfo?: UpdateInfo;
  error?: string;
}

interface UpdateModalState {
  isVisible: boolean;
  updateInfo: UpdateInfo | null;
  showModal: (info: UpdateInfo) => void;
  hideModal: () => void;
}

export const useUpdateModal = create<UpdateModalState>((set) => ({
  isVisible: false,
  updateInfo: null,
  showModal: (info) => set({ isVisible: true, updateInfo: info }),
  hideModal: () => set({ isVisible: false, updateInfo: null }),
}));

/**
 * Compares two semantic version strings (e.g. "1.0.0" vs "1.1.0").
 * Returns:
 *   1 if v1 > v2
 *  -1 if v1 < v2
 *   0 if v1 == v2
 */
export function compareVersions(v1: string, v2: string): number {
  const p1 = (v1 || '0').split('.').map((x) => parseInt(x, 10) || 0);
  const p2 = (v2 || '0').split('.').map((x) => parseInt(x, 10) || 0);
  const len = Math.max(p1.length, p2.length);

  for (let i = 0; i < len; i++) {
    const num1 = p1[i] ?? 0;
    const num2 = p2[i] ?? 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

/**
 * Opens Google Play Store to the app page.
 * Uses native market:// intent first, and falls back to HTTPS web link.
 */
export async function openPlayStore(customMarketUrl?: string, customWebUrl?: string): Promise<boolean> {
  const marketUrl = customMarketUrl || PLAY_STORE_MARKET_URL;
  const webUrl = customWebUrl || PLAY_STORE_WEB_URL;

  try {
    const canOpen = await Linking.canOpenURL(marketUrl);
    if (canOpen) {
      await Linking.openURL(marketUrl);
      return true;
    }
  } catch (_e) {
    // Continue to fallback web URL
  }

  try {
    await Linking.openURL(webUrl);
    return true;
  } catch (err) {
    console.warn('Could not open Play Store URL:', err);
    return false;
  }
}

// Memory cache to avoid checking remote endpoint repeatedly in the same session
let lastCheckedAt = 0;
const SESSION_CHECK_THROTTLE_MS = 60 * 60 * 1000; // 1 hour

/**
 * Checks for a new app version from the remote JSON config.
 */
export async function checkForUpdate(force = false): Promise<UpdateCheckResult> {
  const now = Date.now();
  if (!force && lastCheckedAt > 0 && now - lastCheckedAt < SESSION_CHECK_THROTTLE_MS) {
    return {
      updateAvailable: false,
      currentVersion: CURRENT_APP_VERSION,
      latestVersion: CURRENT_APP_VERSION,
    };
  }

  lastCheckedAt = now;

  try {
    // Fetch remote config with 6-second timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`${REMOTE_VERSION_URL}?_t=${now}`, {
      signal: controller.signal,
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return {
        updateAvailable: false,
        currentVersion: CURRENT_APP_VERSION,
        latestVersion: CURRENT_APP_VERSION,
        error: `HTTP ${res.status}`,
      };
    }

    const data: UpdateInfo = await res.json();
    const latestVersion = data.latestVersion?.trim() || CURRENT_APP_VERSION;
    const hasUpdate = compareVersions(latestVersion, CURRENT_APP_VERSION) > 0;

    return {
      updateAvailable: hasUpdate,
      currentVersion: CURRENT_APP_VERSION,
      latestVersion,
      updateInfo: hasUpdate ? data : undefined,
    };
  } catch (err: any) {
    return {
      updateAvailable: false,
      currentVersion: CURRENT_APP_VERSION,
      latestVersion: CURRENT_APP_VERSION,
      error: err?.message || 'Network error',
    };
  }
}

