import Constants from 'expo-constants';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { createBackup, MAX_BACKUP_BYTES, parseBackup } from '@/lib/backup';
import { toCsv } from '@/lib/csv';
import { backupFileStamp } from '@/lib/time';
import type { NotificationRecord } from '@/lib/types';
import { importRecords, readAllRecords } from './repository';

export type ExportFormat = 'csv' | 'json';

const appVersion = () => Constants.expoConfig?.version ?? '1.0.0';

async function writeAndShare(name: string, content: string, mimeType: string): Promise<void> {
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  file.write(content);
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device.');
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: 'Save or share export' });
}

/** Exports the given records. The file stays on the device until the user picks a destination. */
export async function exportRecords(records: NotificationRecord[], format: ExportFormat, now: number = Date.now()): Promise<void> {
  if (records.length === 0) throw new Error('There is nothing to export.');
  const stamp = backupFileStamp(now);
  if (format === 'csv') await writeAndShare(`noticatch-export-${stamp}.csv`, toCsv(records), 'text/csv');
  else await writeAndShare(`noticatch-export-${stamp}.json`, createBackup(records, appVersion(), now), 'application/json');
}

/** Full backup of everything, including archived items and favourites. */
export async function createFullBackup(now: number = Date.now()): Promise<number> {
  const all = await readAllRecords();
  if (all.length === 0) throw new Error('There is no history to back up yet.');
  await writeAndShare(`noticatch-backup-${backupFileStamp(now)}.json`, createBackup(all, appVersion(), now), 'application/json');
  return all.length;
}

export type RestoreOutcome =
  | { status: 'cancelled' }
  | { status: 'invalid'; error: string }
  | { status: 'ready'; count: number; createdAt: number; commit: () => Promise<{ inserted: number; skipped: number }> };

/** Lets the user pick a file, validates it completely, and returns a commit step. Nothing is written before commit. */
export async function pickBackupForRestore(): Promise<RestoreOutcome> {
  const picked = await File.pickFileAsync({ mimeTypes: ['application/json', 'text/plain', '*/*'] });
  if (picked.canceled) return { status: 'cancelled' };
  const file = picked.result;
  if ((file.size ?? 0) > MAX_BACKUP_BYTES) return { status: 'invalid', error: 'The file is too large to be a NotiCatch backup.' };
  const parsed = parseBackup(await file.text());
  if (!parsed.ok) return { status: 'invalid', error: parsed.error };
  const { notifications, count, createdAt } = parsed.data;
  return { status: 'ready', count, createdAt, commit: () => importRecords(notifications) };
}
