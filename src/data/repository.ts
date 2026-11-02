import { lastDayStarts } from '@/lib/time';
import type {
  AppSummary, BackupRecord, Conversation, InstalledApp, NotificationRecord, QueryFilter, Stats,
} from '@/lib/types';
import { getNative, requireNative } from './native';

export interface CaptureConfig {
  captureEnabled: boolean;
  captureOngoing: boolean;
  skipGroupSummary: boolean;
  /** 0 = never delete */
  retentionDays: number;
  keepFavorites: boolean;
  keepArchived: boolean;
  excludedPackages: string[];
}

export type ChangeType = 'posted' | 'removed' | 'updated' | 'cleanup' | 'connected' | 'disconnected';

const filterJson = (f: QueryFilter) =>
  JSON.stringify({
    search: f.search?.trim() || null,
    packages: f.packages ?? [],
    from: f.from ?? null,
    to: f.to ?? null,
    favoritesOnly: f.favoritesOnly ?? false,
    deletedOnly: f.deletedOnly ?? false,
    archived: f.archived ?? 'exclude',
    limit: f.limit ?? 100,
    offset: f.offset ?? 0,
  });

const ids = (list: number[]) => JSON.stringify(list);

// ------------------------------------------------------------------ access

export const isNativeAvailable = (): boolean => getNative() !== null;
export const isAccessGranted = async (): Promise<boolean> => (getNative() ? requireNative().isAccessGranted() : false);
export const openAccessSettings = (): Promise<void> => requireNative().openAccessSettings();
export const openAppSettings = (): Promise<void> => requireNative().openAppSettings();
export const requestRebind = (): Promise<void> => requireNative().requestRebind();
export const configureCapture = (c: CaptureConfig): Promise<void> => requireNative().configure(JSON.stringify(c));

export function subscribeToChanges(cb: (type: ChangeType) => void): () => void {
  const native = getNative();
  if (!native) return () => undefined;
  const sub = native.addListener('onChange', (e) => cb(e.type));
  return () => sub.remove();
}

// ------------------------------------------------------------------ reads

export async function queryNotifications(filter: QueryFilter): Promise<NotificationRecord[]> {
  return JSON.parse(await requireNative().query(filterJson(filter))) as NotificationRecord[];
}

export const countNotifications = (filter: QueryFilter): Promise<number> => requireNative().count(filterJson(filter));

export async function getNotificationsByIds(list: number[]): Promise<NotificationRecord[]> {
  if (list.length === 0) return [];
  return JSON.parse(await requireNative().getByIds(ids(list))) as NotificationRecord[];
}

export async function getNotification(id: number): Promise<NotificationRecord | null> {
  return (await getNotificationsByIds([id]))[0] ?? null;
}

export async function getStats(now: number = Date.now(), days = 7): Promise<Stats> {
  const starts = lastDayStarts(days, now);
  const end = Math.max(now, (starts[starts.length - 1] ?? now) + 86_400_000);
  const raw = JSON.parse(await requireNative().getStats(JSON.stringify(starts), end)) as Stats;
  return raw;
}

export async function getAppSummaries(): Promise<AppSummary[]> {
  return JSON.parse(await requireNative().getAppSummaries()) as AppSummary[];
}

export async function getConversations(): Promise<Conversation[]> {
  if (!getNative()) return [];
  return JSON.parse(await requireNative().getConversations()) as Conversation[];
}

export async function getConversationMessages(packageName: string, title: string): Promise<NotificationRecord[]> {
  if (!getNative()) return [];
  return JSON.parse(await requireNative().getConversationMessages(packageName, title)) as NotificationRecord[];
}

export async function canReply(sbnKey: string | null, chatKey: string | null = null): Promise<boolean> {
  return getNative() ? requireNative().canReply(sbnKey, chatKey) : false;
}

export async function sendReply(sbnKey: string | null, chatKey: string | null, text: string): Promise<boolean> {
  return getNative() ? requireNative().sendReply(sbnKey, chatKey, text) : false;
}

export async function getInstalledApps(): Promise<InstalledApp[]> {
  return JSON.parse(await requireNative().getInstalledApps()) as InstalledApp[];
}

export const getAppIcon = (packageName: string): Promise<string | null> => requireNative().getAppIcon(packageName);

// ------------------------------------------------------------------ writes

export const setFavorite = (list: number[], value: boolean): Promise<number> => requireNative().setFavorite(ids(list), value);
export const setArchived = (list: number[], value: boolean): Promise<number> => requireNative().setArchived(ids(list), value);
export const deleteNotifications = (list: number[]): Promise<number> => requireNative().deleteByIds(ids(list));
export const clearHistory = (keepFavorites: boolean): Promise<number> => requireNative().clearAll(keepFavorites);
export const runCleanup = (days: number | null, keepFavorites: boolean, keepArchived: boolean): Promise<number> =>
  days === null ? Promise.resolve(0) : requireNative().runCleanup(days, keepFavorites, keepArchived);

// ------------------------------------------------------------------ export / import

/** Reads the complete history (including archived) page by page. */
export async function readAllRecords(pageSize = 500): Promise<NotificationRecord[]> {
  const all: NotificationRecord[] = [];
  for (let offset = 0; ; offset += pageSize) {
    const page = await queryNotifications({ archived: 'include', limit: pageSize, offset });
    all.push(...page);
    if (page.length < pageSize) break;
  }
  return all;
}

export async function importRecords(records: BackupRecord[], chunkSize = 1000): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;
  for (let i = 0; i < records.length; i += chunkSize) {
    const res = JSON.parse(await requireNative().importRecords(JSON.stringify(records.slice(i, i + chunkSize)))) as {
      inserted: number;
      skipped: number;
    };
    inserted += res.inserted;
    skipped += res.skipped;
  }
  return { inserted, skipped };
}
