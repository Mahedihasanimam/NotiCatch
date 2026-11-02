import type { BackupRecord, NotificationRecord } from './types';

export const BACKUP_FORMAT = 'noticatch-backup';
export const BACKUP_VERSION = 1;
export const MAX_BACKUP_BYTES = 100 * 1024 * 1024;
export const MAX_BACKUP_RECORDS = 500_000;

export interface BackupFile {
  format: typeof BACKUP_FORMAT;
  version: number;
  createdAt: number;
  appVersion: string;
  count: number;
  /** FNV-1a over the serialised notifications array. Detects truncation/corruption, not tampering. */
  checksum: string;
  notifications: BackupRecord[];
}

export type ParseResult = { ok: true; data: BackupFile } | { ok: false; error: string };

export function fnv1a(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

export function toBackupRecord(r: NotificationRecord | BackupRecord): BackupRecord {
  return {
    sbnKey: r.sbnKey, packageName: r.packageName, appName: r.appName, title: r.title, text: r.text,
    bigText: r.bigText, subText: r.subText, category: r.category, channelId: r.channelId,
    groupKey: r.groupKey, isGroupSummary: r.isGroupSummary, isOngoing: r.isOngoing, postedAt: r.postedAt,
    removedAt: r.removedAt, removalReason: r.removalReason, isFavorite: r.isFavorite, isArchived: r.isArchived,
    isDeleted: r.isDeleted ?? false, deletedAt: r.deletedAt ?? null,
    mediaPath: r.mediaPath ?? null, mediaType: r.mediaType ?? null,
  };
}

export function createBackup(records: NotificationRecord[], appVersion: string, now: number = Date.now()): string {
  const notifications = records.map(toBackupRecord);
  const file: BackupFile = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt: now,
    appVersion,
    count: notifications.length,
    checksum: fnv1a(JSON.stringify(notifications)),
    notifications,
  };
  return JSON.stringify(file);
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const strOrNull = (v: unknown): string | null | undefined =>
  v === null || v === undefined ? null : typeof v === 'string' ? v : undefined;
const numOrNull = (v: unknown): number | null | undefined =>
  v === null || v === undefined ? null : typeof v === 'number' && Number.isFinite(v) ? v : undefined;
const bool = (v: unknown): boolean | undefined => (v === undefined ? false : typeof v === 'boolean' ? v : undefined);

function parseRecord(raw: unknown): BackupRecord | null {
  if (!isObj(raw)) return null;
  const packageName = raw.packageName;
  const postedAt = raw.postedAt;
  if (typeof packageName !== 'string' || packageName.length === 0 || packageName.length > 255) return null;
  if (typeof postedAt !== 'number' || !Number.isFinite(postedAt) || postedAt <= 0) return null;
  const title = strOrNull(raw.title), text = strOrNull(raw.text), bigText = strOrNull(raw.bigText);
  const subText = strOrNull(raw.subText), category = strOrNull(raw.category), channelId = strOrNull(raw.channelId);
  const groupKey = strOrNull(raw.groupKey), sbnKey = strOrNull(raw.sbnKey), appName = strOrNull(raw.appName);
  const removedAt = numOrNull(raw.removedAt), removalReason = numOrNull(raw.removalReason);
  const isFavorite = bool(raw.isFavorite), isArchived = bool(raw.isArchived);
  const isDeleted = bool(raw.isDeleted);
  const deletedAt = numOrNull(raw.deletedAt);
  const mediaPath = strOrNull(raw.mediaPath), mediaType = strOrNull(raw.mediaType);
  const isGroupSummary = bool(raw.isGroupSummary), isOngoing = bool(raw.isOngoing);
  if ([title, text, bigText, subText, category, channelId, groupKey, sbnKey, appName, removedAt, removalReason,
    isFavorite, isArchived, isDeleted, isGroupSummary, isOngoing].some((v) => v === undefined)) return null;
  return {
    sbnKey: sbnKey ?? `import:${packageName}:${postedAt}`,
    packageName,
    appName: appName ?? packageName,
    title: title ?? null, text: text ?? null, bigText: bigText ?? null, subText: subText ?? null,
    category: category ?? null, channelId: channelId ?? null, groupKey: groupKey ?? null,
    isGroupSummary: isGroupSummary ?? false, isOngoing: isOngoing ?? false,
    postedAt, removedAt: removedAt ?? null, removalReason: removalReason ?? null,
    isFavorite: isFavorite ?? false, isArchived: isArchived ?? false,
    isDeleted: isDeleted ?? false, deletedAt: deletedAt ?? null,
    mediaPath: mediaPath ?? null, mediaType: mediaType ?? null,
  };
}

/** Validates an imported backup. Nothing is written until this returns ok. */
export function parseBackup(text: string): ParseResult {
  if (text.length > MAX_BACKUP_BYTES) return { ok: false, error: 'The file is too large to be a NotiCatch backup.' };
  let json: unknown;
  try {
    json = JSON.parse(text.replace(/^\uFEFF/, ''));
  } catch {
    return { ok: false, error: 'The file is not valid JSON.' };
  }
  if (!isObj(json) || (json.format !== BACKUP_FORMAT && json.format !== 'keepsake-backup')) return { ok: false, error: 'This is not a NotiCatch backup file.' };
  const version = json.version;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) return { ok: false, error: 'The backup has no valid version.' };
  if (version > BACKUP_VERSION) return { ok: false, error: 'This backup was made by a newer version of NotiCatch. Update the app and try again.' };
  if (!Array.isArray(json.notifications)) return { ok: false, error: 'The backup contains no notification list.' };
  if (json.notifications.length > MAX_BACKUP_RECORDS) return { ok: false, error: 'The backup contains too many records.' };

  const notifications: BackupRecord[] = [];
  for (let i = 0; i < json.notifications.length; i++) {
    const rec = parseRecord(json.notifications[i]);
    if (!rec) return { ok: false, error: `Record ${i + 1} is malformed. Nothing was imported.` };
    notifications.push(rec);
  }
  if (typeof json.checksum === 'string' && json.checksum !== fnv1a(JSON.stringify(json.notifications))) {
    return { ok: false, error: 'The checksum does not match. The file is damaged or was edited.' };
  }
  if (typeof json.count === 'number' && json.count !== notifications.length) {
    return { ok: false, error: 'The record count does not match. The file is incomplete.' };
  }
  return {
    ok: true,
    data: {
      format: BACKUP_FORMAT, version, notifications,
      createdAt: typeof json.createdAt === 'number' ? json.createdAt : 0,
      appVersion: typeof json.appVersion === 'string' ? json.appVersion : 'unknown',
      count: notifications.length,
      checksum: typeof json.checksum === 'string' ? json.checksum : '',
    },
  };
}
