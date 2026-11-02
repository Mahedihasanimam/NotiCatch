import { csvField, toCsv } from '../csv';
import { RETENTION_OPTIONS, retentionCutoff, retentionLabel } from '../retention';
import { rec } from '@/testing/fixtures';

describe('csv', () => {
  it('quotes commas, quotes and newlines', () => {
    expect(csvField('a,b')).toBe('"a,b"');
    expect(csvField('say "hi"')).toBe('"say ""hi"""');
    expect(csvField('l1\nl2')).toBe('"l1\nl2"');
    expect(csvField(null)).toBe('');
  });

  it('neutralises spreadsheet formulas', () => {
    expect(csvField('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvField('+1')).toBe("'+1");
    expect(csvField('@cmd')).toBe("'@cmd");
  });

  it('writes header, BOM and one row per record', () => {
    const out = toCsv([rec({ id: 5, title: 'Hi, there', isFavorite: true })]);
    const lines = out.replace('\uFEFF', '').trim().split('\r\n');
    expect(lines[0]).toMatch(/^id,posted_at_iso,app_name/);
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('"Hi, there"');
    expect(lines[1]).toContain(',yes,no,');
  });
});

describe('retention', () => {
  it('offers exactly the required options', () => {
    expect(RETENTION_OPTIONS.map((o) => o.days)).toEqual([7, 15, 30, 90, null]);
  });
  it('computes cutoffs', () => {
    expect(retentionCutoff(null, 1000)).toBeNull();
    expect(retentionCutoff(7, 7 * 86_400_000 + 5)).toBe(5);
    expect(retentionLabel(30)).toBe('30 days');
  });
});
