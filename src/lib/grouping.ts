import { dayLabel, startOfDay } from './time';
import type { NotificationRecord } from './types';

export interface Section {
  key: string;
  title: string;
  data: NotificationRecord[];
}

/** Input must be sorted newest first (as returned by the database). */
export function groupByDate(records: NotificationRecord[], now: number = Date.now()): Section[] {
  const sections: Section[] = [];
  for (const r of records) {
    const key = String(startOfDay(r.postedAt));
    const last = sections[sections.length - 1];
    if (last && last.key === key) last.data.push(r);
    else sections.push({ key, title: dayLabel(r.postedAt, now), data: [r] });
  }
  return sections;
}

/** Groups by package, ordering apps by their most recent notification. */
export function groupByApp(records: NotificationRecord[]): Section[] {
  const map = new Map<string, Section>();
  for (const r of records) {
    const existing = map.get(r.packageName);
    if (existing) existing.data.push(r);
    else map.set(r.packageName, { key: r.packageName, title: r.appName, data: [r] });
  }
  return [...map.values()];
}
