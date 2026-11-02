const mockSecure = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 1,
  getItemAsync: jest.fn(async (k: string) => mockSecure.get(k) ?? null),
  setItemAsync: jest.fn(async (k: string, v: string) => void mockSecure.set(k, v)),
  deleteItemAsync: jest.fn(async (k: string) => void mockSecure.delete(k)),
}));
jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  digestStringAsync: jest.fn(async (_a: string, s: string) => require('crypto').createHash('sha256').update(s).digest('hex')),
  getRandomBytes: (n: number) => require('crypto').randomBytes(n),
}));
jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(async () => true),
  isEnrolledAsync: jest.fn(async () => true),
  authenticateAsync: jest.fn(async () => ({ success: true })),
}));

import * as LocalAuthentication from 'expo-local-authentication';
import { DEFAULT_SETTINGS, useSettings } from '../settings';
import { useSecurity } from '../security';

beforeEach(() => {
  mockSecure.clear();
  useSettings.setState({ ...DEFAULT_SETTINGS });
  useSecurity.setState({ ready: false, hasPin: false, locked: false, authBusy: false });
  jest.useRealTimers();
});

describe('security store', () => {
  it('stores a salted hash, never the PIN, and unlocks with the right PIN', async () => {
    await useSecurity.getState().setPin('2468');
    const stored = mockSecure.get('keepsake.pin.v1')!;
    expect(stored).not.toContain('2468');
    expect(JSON.parse(stored)).toHaveProperty('salt');
    expect(useSettings.getState().lockEnabled).toBe(true);

    useSecurity.getState().lock();
    expect(useSecurity.getState().locked).toBe(true);
    expect((await useSecurity.getState().verifyPin('2468')).ok).toBe(true);
    expect(useSecurity.getState().locked).toBe(false);
  });

  it('rejects invalid PINs', async () => {
    await expect(useSecurity.getState().setPin('12')).rejects.toThrow();
  });

  it('counts failures and locks out after five wrong attempts', async () => {
    await useSecurity.getState().setPin('1357');
    let last: Awaited<ReturnType<ReturnType<typeof useSecurity.getState>['verifyPin']>> = { ok: true };
    for (let i = 0; i < 4; i++) last = await useSecurity.getState().verifyPin('0000');
    expect(last).toMatchObject({ ok: false, reason: 'wrong', attemptsLeft: 1 });
    last = await useSecurity.getState().verifyPin('0000');
    expect(last).toMatchObject({ ok: false, reason: 'locked' });
    // Even the correct PIN is refused while locked out.
    expect(await useSecurity.getState().verifyPin('1357')).toMatchObject({ ok: false, reason: 'locked' });
  });

  it('removes credentials and disables lock', async () => {
    await useSecurity.getState().setPin('1357');
    await useSecurity.getState().removePin();
    expect(mockSecure.size).toBe(0);
    expect(useSettings.getState()).toMatchObject({ lockEnabled: false, biometricEnabled: false });
  });

  it('disables a lock whose credentials disappeared', async () => {
    useSettings.getState().update({ lockEnabled: true });
    await useSecurity.getState().init();
    expect(useSettings.getState().lockEnabled).toBe(false);
    expect(useSecurity.getState().locked).toBe(false);
  });

  it('locks on init when a PIN exists and only uses biometrics when enabled', async () => {
    await useSecurity.getState().setPin('1357');
    await useSecurity.getState().init();
    expect(useSecurity.getState().locked).toBe(true);
    expect(await useSecurity.getState().unlockWithBiometrics()).toBe(false);
    expect(LocalAuthentication.authenticateAsync).not.toHaveBeenCalled();
    useSettings.getState().update({ biometricEnabled: true });
    expect(await useSecurity.getState().unlockWithBiometrics()).toBe(true);
    expect(useSecurity.getState().locked).toBe(false);
  });
});
