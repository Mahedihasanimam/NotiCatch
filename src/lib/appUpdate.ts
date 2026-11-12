import Constants from 'expo-constants';
import { Linking } from 'react-native';
import { create } from 'zustand';
import { checkPlayUpdate, isNativeAvailable, startPlayUpdate, type PlayUpdateInfo } from '@/data/repository';

export const CURRENT_APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
export const PLAY_STORE_PACKAGE = 'com.mehedi.noticatch.app';
export const PLAY_STORE_MARKET_URL = `market://details?id=${PLAY_STORE_PACKAGE}`;
export const PLAY_STORE_WEB_URL = `https://play.google.com/store/apps/details?id=${PLAY_STORE_PACKAGE}`;

// Remote version file (hosted in the GitHub repo): release notes + fallback for non-Play installs
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
  /** Where the check came from: Google Play in-app updates or the remote version file. */
  source?: 'play' | 'remote';
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
 * Launches the native Google Play Store app directly (market://),
 * with fallback to the web browser (https://play.google.com/...) if Play Store is absent.
 */
export async function openPlayStore(customMarketUrl?: string, customWebUrl?: string): Promise<boolean> {
  const marketUrl = customMarketUrl || PLAY_STORE_MARKET_URL;
  const webUrl = customWebUrl || PLAY_STORE_WEB_URL;

  // 1. Try launching Google Play Store application directly
  try {
    await Linking.openURL(marketUrl);
    return true;
  } catch (_marketErr) {
    // 2. If market:// intent fails, launch via web browser
    try {
      await Linking.openURL(webUrl);
      return true;
    } catch (webErr) {
      console.warn('Could not open Play Store URL:', webErr);
      return false;
    }
  }
}

// Memory cache to avoid checking repeatedly in the same session
let lastCheckedAt = 0;
const SESSION_CHECK_THROTTLE_MS = 60 * 60 * 1000; // 1 hour

/** Play "update priority" (0-5, set per release in the Play Console) at/above which we force. */
const FORCE_PRIORITY = 4;

const noUpdate = (error?: string): UpdateCheckResult => ({
  updateAvailable: false,
  currentVersion: CURRENT_APP_VERSION,
  latestVersion: CURRENT_APP_VERSION,
  ...(error ? { error } : {}),
});

/** Remote version file (release notes / copy). Best effort: null on any failure. */
async function fetchRemoteInfo(): Promise<UpdateInfo | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(`${REMOTE_VERSION_URL}?_t=${Date.now()}`, {
      signal: controller.signal,
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!res.ok) return null;
    return (await res.json()) as UpdateInfo;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Checks for a newer version.
 *
 * 1. Google Play In-App Updates is the source of truth (works for Play installs).
 *    The remote version file only supplies title / release notes when it describes that newer build.
 * 2. If Play can't answer (dev build, sideloaded APK, no Play Store), fall back to the remote file.
 */
export async function checkForUpdate(force = false): Promise<UpdateCheckResult> {
  const now = Date.now();
  if (!force && lastCheckedAt > 0 && now - lastCheckedAt < SESSION_CHECK_THROTTLE_MS) {
    return noUpdate();
  }
  lastCheckedAt = now;

  let play: PlayUpdateInfo | null = null;
  try {
    play = isNativeAvailable() ? await checkPlayUpdate() : null;
  } catch {
    play = null;
  }

  if (play) {
    if (!play.available) return noUpdate();
    const remote = await fetchRemoteInfo();
    const remoteIsNewer =
      !!remote &&
      (remote.versionCode
        ? remote.versionCode >= play.availableVersionCode
        : compareVersions(remote.latestVersion, CURRENT_APP_VERSION) > 0);
    const info: UpdateInfo = {
      ...(remoteIsNewer ? remote : {}),
      latestVersion: remoteIsNewer && remote ? remote.latestVersion : `build ${play.availableVersionCode}`,
      versionCode: play.availableVersionCode,
      forceUpdate: Boolean((remoteIsNewer && remote?.forceUpdate) || play.priority >= FORCE_PRIORITY),
      source: 'play',
    };
    return {
      updateAvailable: true,
      currentVersion: CURRENT_APP_VERSION,
      latestVersion: info.latestVersion,
      updateInfo: info,
    };
  }

  const data = await fetchRemoteInfo();
  if (!data) return noUpdate('Network error');
  const latestVersion = data.latestVersion?.trim() || CURRENT_APP_VERSION;
  const hasUpdate = compareVersions(latestVersion, CURRENT_APP_VERSION) > 0;
  return {
    updateAvailable: hasUpdate,
    currentVersion: CURRENT_APP_VERSION,
    latestVersion,
    updateInfo: hasUpdate ? { ...data, source: 'remote' } : undefined,
  };
}

/**
 * Runs the update: Play's in-app flow when available, otherwise opens the store listing.
 * @returns 'play' when Play took over, 'store' when the listing was opened, 'failed' otherwise.
 */
export async function startUpdate(info: UpdateInfo): Promise<'play' | 'store' | 'failed'> {
  if (info.source === 'play') {
    try {
      if (await startPlayUpdate(Boolean(info.forceUpdate))) return 'play';
    } catch {
      // fall through to the store listing
    }
  }
  return (await openPlayStore(info.playStoreUrl, info.fallbackUrl)) ? 'store' : 'failed';
}

/** "1.2.0" → "v1.2.0"; "build 7" stays as is. */
export const formatVersion = (v: string): string => (/^\d/.test(v) ? `v${v}` : v);
