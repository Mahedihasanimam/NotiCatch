import { constantTimeEqual, hashPin, isValidPin, lockoutMs, MAX_LOCKOUT_MS } from '../pin';

const fakeDigest = async (s: string) => `h(${s.length}:${s.slice(0, 6)})`;

describe('pin', () => {
  it('validates length and digits only', () => {
    expect(isValidPin('1234')).toBe(true);
    expect(isValidPin('12345678')).toBe(true);
    expect(isValidPin('123')).toBe(false);
    expect(isValidPin('123456789')).toBe(false);
    expect(isValidPin('12a4')).toBe(false);
  });

  it('hashes with salt and rounds', async () => {
    const a = await hashPin('1234', 's1', fakeDigest, 3);
    const b = await hashPin('1234', 's1', fakeDigest, 3);
    const c = await hashPin('1235', 's1', async (s) => s + '!', 3);
    expect(a).toBe(b);
    expect(c).toContain('1235');
  });

  it('compares in constant-time style', () => {
    expect(constantTimeEqual('abc', 'abc')).toBe(true);
    expect(constantTimeEqual('abc', 'abd')).toBe(false);
    expect(constantTimeEqual('abc', 'ab')).toBe(false);
  });

  it('backs off after five failures with a cap', () => {
    expect(lockoutMs(4)).toBe(0);
    expect(lockoutMs(5)).toBe(30_000);
    expect(lockoutMs(6)).toBe(60_000);
    expect(lockoutMs(50)).toBe(MAX_LOCKOUT_MS);
  });
});
