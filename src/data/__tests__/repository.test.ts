import { __resetNativeCache } from '../native';
import { rec } from '@/testing/fixtures';

const mockNative = {
  isAccessGranted: jest.fn(async () => true),
  query: jest.fn(async (_json: string) => JSON.stringify([rec({ id: 1 })])),
  count: jest.fn(async () => 7),
  getByIds: jest.fn(async (_json: string) => JSON.stringify([rec({ id: 9 })])),
  getStats: jest.fn(async (_starts: string, _end: number) => JSON.stringify({ total: 5, today: 2, favorites: 1, archived: 0, daily: [0, 0, 0, 0, 0, 3, 2] })),
  setFavorite: jest.fn(async () => 2),
  importRecords: jest.fn(async (json: string) => JSON.stringify({ inserted: JSON.parse(json).length, skipped: 0 })),
  runCleanup: jest.fn(async () => 4),
  getConversations: jest.fn(async () => JSON.stringify([])),
  getConversationMessages: jest.fn(async (_pkg: string, _title: string) => JSON.stringify([])),
  canReply: jest.fn(async (_sbnKey: string | null, _chatKey: string | null) => true),
  sendReply: jest.fn(async (_sbnKey: string | null, _chatKey: string | null, _text: string) => true),
  addListener: jest.fn(() => ({ remove: jest.fn() })),
};
jest.mock('@native', () => ({ __esModule: true, default: mockNative }));

import * as repo from '../repository';

beforeEach(() => {
  jest.clearAllMocks();
  __resetNativeCache();
});

describe('repository', () => {
  it('serialises filters with defaults and parses rows', async () => {
    const rows = await repo.queryNotifications({ search: '  hello ', packages: ['a'], favoritesOnly: true });
    expect(rows[0]!.id).toBe(1);
    expect(JSON.parse(mockNative.query.mock.calls[0]![0] as string)).toEqual({
      search: 'hello', packages: ['a'], from: null, to: null, favoritesOnly: true, deletedOnly: false, archived: 'exclude', limit: 100, offset: 0,
    });
  });

  it('reads one record by id', async () => {
    expect((await repo.getNotification(9))!.id).toBe(9);
    expect(await repo.getNotificationsByIds([])).toEqual([]);
  });

  it('passes seven day starts to stats', async () => {
    const stats = await repo.getStats(new Date(2026, 9, 31, 12).getTime());
    expect(stats.daily).toHaveLength(7);
    const starts = JSON.parse(mockNative.getStats.mock.calls[0]![0] as string) as number[];
    expect(starts).toHaveLength(7);
  });

  it('pages through the full history for export', async () => {
    mockNative.query
      .mockResolvedValueOnce(JSON.stringify([rec({ id: 1 }), rec({ id: 2 })]))
      .mockResolvedValueOnce(JSON.stringify([rec({ id: 3 })]));
    const all = await repo.readAllRecords(2);
    expect(all.map((r) => r.id)).toEqual([1, 2, 3]);
    expect(JSON.parse(mockNative.query.mock.calls[0]![0] as string).archived).toBe('include');
  });

  it('imports in chunks and sums results', async () => {
    const records = Array.from({ length: 5 }, () => { const { id: _id, ...r } = rec(); return r; });
    const res = await repo.importRecords(records, 2);
    expect(res).toEqual({ inserted: 5, skipped: 0 });
    expect(mockNative.importRecords).toHaveBeenCalledTimes(3);
  });

  it('skips cleanup when retention is off', async () => {
    expect(await repo.runCleanup(null, true, true)).toBe(0);
    expect(mockNative.runCleanup).not.toHaveBeenCalled();
    expect(await repo.runCleanup(7, true, false)).toBe(4);
  });

  it('subscribes and unsubscribes to change events', () => {
    const off = repo.subscribeToChanges(() => undefined);
    expect(mockNative.addListener).toHaveBeenCalledWith('onChange', expect.any(Function));
    off();
  });

  it('can check reply status and send inline reply', async () => {
    expect(await repo.canReply('key1')).toBe(true);
    expect(mockNative.canReply).toHaveBeenCalledWith('key1', null);
    expect(await repo.sendReply('key1', null, 'Hello back!')).toBe(true);
    expect(mockNative.sendReply).toHaveBeenCalledWith('key1', null, 'Hello back!');
  });

  it('queries conversations and conversation messages', async () => {
    expect(await repo.getConversations()).toEqual([]);
    expect(await repo.getConversationMessages('com.whatsapp', 'John')).toEqual([]);
  });
});
