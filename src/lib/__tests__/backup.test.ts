import { BACKUP_VERSION, createBackup, fnv1a, parseBackup } from '../backup';
import { rec } from '@/testing/fixtures';

describe('backup', () => {
  const records = [rec({ id: 1, isFavorite: true }), rec({ id: 2, title: null, text: null, bigText: 'long', postedAt: 1_700_000_000_000 })];

  it('round-trips and drops local ids', () => {
    const parsed = parseBackup(createBackup(records, '1.0.0', 123));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.data.count).toBe(2);
    expect(parsed.data.createdAt).toBe(123);
    expect(parsed.data.notifications[0]).not.toHaveProperty('id');
    expect(parsed.data.notifications[0]!.isFavorite).toBe(true);
  });

  it.each([
    ['not json', 'nope', /not valid JSON/],
    ['wrong format', JSON.stringify({ format: 'other' }), /not a NotiCatch backup/],
    ['no version', JSON.stringify({ format: 'noticatch-backup' }), /valid version/],
    ['future version', JSON.stringify({ format: 'noticatch-backup', version: BACKUP_VERSION + 1, notifications: [] }), /newer version/],
    ['missing list', JSON.stringify({ format: 'noticatch-backup', version: 1 }), /no notification list/],
  ])('rejects %s', (_n, text, re) => {
    const r = parseBackup(text);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(re);
  });

  it('rejects malformed records without partial import', () => {
    const bad = JSON.stringify({ format: 'noticatch-backup', version: 1, notifications: [{ packageName: 'a', postedAt: 5 }, { packageName: '', postedAt: 5 }] });
    const r = parseBackup(bad);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/Record 2/);
  });

  it('rejects wrong field types', () => {
    const r = parseBackup(JSON.stringify({ format: 'noticatch-backup', version: 1, notifications: [{ packageName: 'a', postedAt: 5, title: 42 }] }));
    expect(r.ok).toBe(false);
  });

  it('detects tampering via checksum and count', () => {
    const file = JSON.parse(createBackup(records, '1.0.0')) as { notifications: { title: string }[]; count: number };
    file.notifications[0]!.title = 'edited';
    expect(parseBackup(JSON.stringify(file)).ok).toBe(false);
    const fresh = JSON.parse(createBackup(records, '1.0.0')) as { count: number };
    fresh.count = 99;
    const r = parseBackup(JSON.stringify(fresh));
    expect(r.ok).toBe(false);
  });

  it('accepts records with only required fields and fills defaults', () => {
    const r = parseBackup(JSON.stringify({ format: 'keepsake-backup', version: 1, notifications: [{ packageName: 'com.x', postedAt: 10 }] }));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.notifications[0]).toMatchObject({ appName: 'com.x', isFavorite: false, removedAt: null });
  });

  it('round-trips deleted message and media metadata', () => {
    const delRec = rec({ id: 99, isDeleted: true, deletedAt: 123456, mediaPath: '/data/saved_media/img.jpg', mediaType: 'image' });
    const parsed = parseBackup(createBackup([delRec], '1.0.0'));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.data.notifications[0]!.isDeleted).toBe(true);
    expect(parsed.data.notifications[0]!.deletedAt).toBe(123456);
    expect(parsed.data.notifications[0]!.mediaPath).toBe('/data/saved_media/img.jpg');
    expect(parsed.data.notifications[0]!.mediaType).toBe('image');
  });

  it('hashes deterministically', () => {
    expect(fnv1a('abc')).toBe(fnv1a('abc'));
    expect(fnv1a('abc')).not.toBe(fnv1a('abd'));
  });
});
