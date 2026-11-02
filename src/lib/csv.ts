import type { NotificationRecord } from './types';

const HEADERS = [
  'id', 'posted_at_iso', 'app_name', 'package_name', 'title', 'text', 'big_text', 'sub_text',
  'category', 'channel_id', 'favorite', 'archived', 'removed_at_iso',
] as const;

/**
 * Escapes one CSV field. Values starting with a formula trigger are prefixed with an apostrophe
 * so spreadsheet apps never evaluate captured notification text (CSV injection).
 */
export function csvField(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const iso = (ts: number | null) => (ts === null ? '' : new Date(ts).toISOString());

export function toCsv(records: NotificationRecord[]): string {
  const rows = records.map((r) =>
    [
      r.id, iso(r.postedAt), r.appName, r.packageName, r.title, r.text, r.bigText, r.subText,
      r.category, r.channelId, r.isFavorite ? 'yes' : 'no', r.isArchived ? 'yes' : 'no', iso(r.removedAt),
    ].map(csvField).join(','),
  );
  // BOM so Excel opens UTF-8 correctly.
  return '\uFEFF' + [HEADERS.join(','), ...rows].join('\r\n') + '\r\n';
}
