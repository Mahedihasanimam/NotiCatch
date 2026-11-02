const DAY_MS = 86_400_000;

export function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Calendar-aware (DST safe) day offset. */
export function addDays(ts: number, days: number): number {
  const d = new Date(ts);
  d.setDate(d.getDate() + days);
  return d.getTime();
}

/** Start timestamps of the last `n` calendar days, oldest first. Last entry is today. */
export function lastDayStarts(n: number, now: number): number[] {
  const today = startOfDay(now);
  return Array.from({ length: n }, (_, i) => startOfDay(addDays(today, -(n - 1 - i))));
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function formatDateTime(ts: number): string {
  const d = new Date(ts);
  return `${d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}, ${formatTime(ts)}`;
}

export function formatNotisaveRelative(ts: number, now: number = Date.now()): string {
  const diff = Math.max(0, now - ts);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) {
    return `${Math.max(1, sec)} seconds ago`;
  }
  const min = Math.floor(diff / 60000);
  if (min < 60) {
    return `${min} minutes ago`;
  }
  const hr = Math.floor(min / 60);
  if (hr < 24) {
    return `${hr} hours ago`;
  }
  const days = Math.floor(hr / 24);
  return `${days} days ago`;
}

export function formatRelative(ts: number, now: number = Date.now()): string {
  const diff = now - ts;
  if (diff < 45_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.max(1, Math.round(diff / 60_000))} min ago`;
  const today = startOfDay(now);
  if (ts >= today) return formatTime(ts);
  if (ts >= today - DAY_MS && startOfDay(ts) === startOfDay(addDays(today, -1))) return `Yesterday, ${formatTime(ts)}`;
  return new Date(ts).toLocaleDateString([], { day: 'numeric', month: 'short' }) + `, ${formatTime(ts)}`;
}

export function dayLabel(ts: number, now: number = Date.now()): string {
  const today = startOfDay(now);
  const day = startOfDay(ts);
  if (day === today) return 'Today';
  if (day === startOfDay(addDays(today, -1))) return 'Yesterday';
  const sameYear = new Date(day).getFullYear() === new Date(today).getFullYear();
  return new Date(day).toLocaleDateString([], {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

export function weekdayInitial(ts: number): string {
  return new Date(ts).toLocaleDateString([], { weekday: 'narrow' });
}

export function backupFileStamp(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}
