import { compareVersions } from '../appUpdate';

describe('compareVersions', () => {
  it('detects newer minor version', () => {
    expect(compareVersions('1.1.0', '1.0.0')).toBe(1);
    expect(compareVersions('1.0.0', '1.1.0')).toBe(-1);
  });

  it('detects newer major version', () => {
    expect(compareVersions('2.0.0', '1.9.9')).toBe(1);
    expect(compareVersions('1.0.0', '2.0.0')).toBe(-1);
  });

  it('detects newer patch version', () => {
    expect(compareVersions('1.0.1', '1.0.0')).toBe(1);
    expect(compareVersions('1.0.0', '1.0.1')).toBe(-1);
  });

  it('returns 0 for identical versions', () => {
    expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
    expect(compareVersions('2.4.1', '2.4.1')).toBe(0);
  });

  it('handles differing length versions properly', () => {
    expect(compareVersions('1.0.0.1', '1.0.0')).toBe(1);
    expect(compareVersions('1.0', '1.0.0')).toBe(0);
  });
});

