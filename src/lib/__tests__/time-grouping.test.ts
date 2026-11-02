import { groupByApp, groupByDate } from '../grouping';
import { addDays, dayLabel, formatRelative, lastDayStarts, startOfDay } from '../time';
import { rec } from '@/testing/fixtures';

const NOW = new Date(2026, 9, 31, 15, 30).getTime();

describe('time', () => {
  it('computes local day starts oldest first with today last', () => {
    const starts = lastDayStarts(7, NOW);
    expect(starts).toHaveLength(7);
    expect(starts[6]).toBe(startOfDay(NOW));
    expect(new Date(starts[0]!).getDate()).toBe(25);
    for (let i = 1; i < starts.length; i++) expect(starts[i]).toBeGreaterThan(starts[i - 1]!);
  });

  it('labels today, yesterday and older days', () => {
    expect(dayLabel(NOW, NOW)).toBe('Today');
    expect(dayLabel(addDays(NOW, -1), NOW)).toBe('Yesterday');
    expect(dayLabel(addDays(NOW, -3), NOW)).not.toMatch(/Today|Yesterday/);
  });

  it('formats relative times', () => {
    expect(formatRelative(NOW - 10_000, NOW)).toBe('Just now');
    expect(formatRelative(NOW - 5 * 60_000, NOW)).toBe('5 min ago');
    expect(formatRelative(addDays(NOW, -1), NOW)).toMatch(/^Yesterday,/);
  });
});

describe('grouping', () => {
  const records = [
    rec({ id: 3, postedAt: NOW - 1000, packageName: 'a', appName: 'A' }),
    rec({ id: 2, postedAt: NOW - 2000, packageName: 'b', appName: 'B' }),
    rec({ id: 1, postedAt: addDays(NOW, -1), packageName: 'a', appName: 'A' }),
  ];

  it('groups by date preserving order', () => {
    const g = groupByDate(records, NOW);
    expect(g.map((s) => s.title)).toEqual(['Today', 'Yesterday']);
    expect(g[0]!.data.map((r) => r.id)).toEqual([3, 2]);
  });

  it('groups by app ordered by latest notification', () => {
    const g = groupByApp(records);
    expect(g.map((s) => s.key)).toEqual(['a', 'b']);
    expect(g[0]!.data).toHaveLength(2);
  });

  it('handles empty input', () => {
    expect(groupByDate([], NOW)).toEqual([]);
    expect(groupByApp([])).toEqual([]);
  });
});
