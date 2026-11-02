export interface RetentionOption {
  days: number | null;
  label: string;
  hint: string;
}

export const RETENTION_OPTIONS: readonly RetentionOption[] = [
  { days: 7, label: '7 days', hint: 'Keep one week of history' },
  { days: 15, label: '15 days', hint: 'Keep about two weeks' },
  { days: 30, label: '30 days', hint: 'Keep one month' },
  { days: 90, label: '90 days', hint: 'Keep three months' },
  { days: null, label: 'Never delete', hint: 'Keep everything until you delete it' },
];

export function retentionLabel(days: number | null): string {
  return RETENTION_OPTIONS.find((o) => o.days === days)?.label ?? 'Never delete';
}

/** Timestamp before which records are eligible for cleanup, or null when retention is off. */
export function retentionCutoff(days: number | null, now: number = Date.now()): number | null {
  return days === null || days <= 0 ? null : now - days * 86_400_000;
}
