import { clearDemoData, getDemoBackupRecords, hasDemoData, loadDemoData } from '../demoData';
import { rec } from '@/testing/fixtures';

const mockNative = {
  importRecords: jest.fn(async (json: string) => JSON.stringify({ inserted: JSON.parse(json).length, skipped: 0 })),
  query: jest.fn(async () => JSON.stringify([])),
  deleteByIds: jest.fn(async () => 1),
};
jest.mock('@native', () => ({ __esModule: true, default: mockNative }));

describe('demoData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('generates demo records with deleted messages and normal notifications', () => {
    const records = getDemoBackupRecords();
    expect(records.length).toBeGreaterThan(4);
    const deleted = records.filter((r) => r.isDeleted);
    expect(deleted.length).toBeGreaterThan(0);
    expect(records.some((r) => r.packageName === 'com.whatsapp')).toBe(true);
  });

  it('loads demo records via importRecords', async () => {
    const inserted = await loadDemoData();
    expect(inserted).toBeGreaterThan(0);
    expect(mockNative.importRecords).toHaveBeenCalled();
  });

  it('checks if demo data is present', async () => {
    mockNative.query.mockResolvedValueOnce(JSON.stringify([rec({ sbnKey: 'demo:whatsapp:1' })]));
    expect(await hasDemoData()).toBe(true);

    mockNative.query.mockResolvedValueOnce(JSON.stringify([rec({ sbnKey: 'normal:1' })]));
    expect(await hasDemoData()).toBe(false);
  });

  it('clears demo data by deleting only demo ids', async () => {
    mockNative.query.mockResolvedValueOnce(
      JSON.stringify([
        rec({ id: 101, sbnKey: 'demo:whatsapp:1' }),
        rec({ id: 102, sbnKey: 'normal:2' }),
      ]),
    );
    const removed = await clearDemoData();
    expect(removed).toBe(1);
    expect(mockNative.deleteByIds).toHaveBeenCalledWith(JSON.stringify([101]));
  });
});

