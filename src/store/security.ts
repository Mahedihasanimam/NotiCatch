import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { constantTimeEqual, hashPin, isValidPin, lockoutMs } from '@/lib/pin';
import { useSettings } from './settings';

const PIN_KEY = 'keepsake.pin.v1';
const ATTEMPTS_KEY = 'keepsake.pin.attempts.v1';
const SECURE_OPTS: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

const digest = (s: string) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, s);
const randomSalt = () => Array.from(Crypto.getRandomBytes(16), (b) => b.toString(16).padStart(2, '0')).join('');

interface Attempts {
  failures: number;
  lockUntil: number;
}

export type PinResult = { ok: true } | { ok: false; reason: 'wrong' | 'locked' | 'no-pin'; retryAt?: number; attemptsLeft?: number };

interface SecurityState {
  ready: boolean;
  hasPin: boolean;
  locked: boolean;
  /** True while a system auth prompt is on screen; app-state changes are ignored meanwhile. */
  authBusy: boolean;
  biometricAvailable: boolean;
  init: () => Promise<void>;
  lock: () => void;
  setPin: (pin: string) => Promise<void>;
  removePin: () => Promise<void>;
  verifyPin: (pin: string) => Promise<PinResult>;
  unlockWithBiometrics: () => Promise<boolean>;
  checkBiometrics: () => Promise<boolean>;
  lockoutRemaining: () => Promise<number>;
}

async function readAttempts(): Promise<Attempts> {
  try {
    const raw = await SecureStore.getItemAsync(ATTEMPTS_KEY, SECURE_OPTS);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Attempts>;
      return { failures: Number(p.failures) || 0, lockUntil: Number(p.lockUntil) || 0 };
    }
  } catch {
    /* fall through */
  }
  return { failures: 0, lockUntil: 0 };
}
const writeAttempts = (a: Attempts) => SecureStore.setItemAsync(ATTEMPTS_KEY, JSON.stringify(a), SECURE_OPTS);

export const useSecurity = create<SecurityState>((set, get) => ({
  ready: false,
  hasPin: false,
  locked: false,
  authBusy: false,
  biometricAvailable: false,

  init: async () => {
    let hasPin = false;
    try {
      hasPin = (await SecureStore.getItemAsync(PIN_KEY, SECURE_OPTS)) !== null;
    } catch {
      hasPin = false;
    }
    const settings = useSettings.getState();
    // If credentials vanished (restore to a new device, cleared keystore) fall back to unlocked + disabled.
    if (settings.lockEnabled && !hasPin) settings.update({ lockEnabled: false, biometricEnabled: false });
    const biometricAvailable = await get().checkBiometrics();
    set({ hasPin, ready: true, biometricAvailable, locked: hasPin && useSettings.getState().lockEnabled });
  },

  lock: () => {
    if (get().hasPin && useSettings.getState().lockEnabled) set({ locked: true });
  },

  checkBiometrics: async () => {
    try {
      const [hw, enrolled] = await Promise.all([LocalAuthentication.hasHardwareAsync(), LocalAuthentication.isEnrolledAsync()]);
      const ok = hw && enrolled;
      set({ biometricAvailable: ok });
      return ok;
    } catch {
      set({ biometricAvailable: false });
      return false;
    }
  },

  setPin: async (pin) => {
    if (!isValidPin(pin)) throw new Error('PIN must be 4 to 8 digits.');
    const salt = randomSalt();
    const hash = await hashPin(pin, salt, digest);
    await SecureStore.setItemAsync(PIN_KEY, JSON.stringify({ salt, hash }), SECURE_OPTS);
    await writeAttempts({ failures: 0, lockUntil: 0 });
    useSettings.getState().update({ lockEnabled: true });
    set({ hasPin: true });
  },

  removePin: async () => {
    await SecureStore.deleteItemAsync(PIN_KEY, SECURE_OPTS);
    await SecureStore.deleteItemAsync(ATTEMPTS_KEY, SECURE_OPTS);
    useSettings.getState().update({ lockEnabled: false, biometricEnabled: false });
    set({ hasPin: false, locked: false });
  },

  lockoutRemaining: async () => Math.max(0, (await readAttempts()).lockUntil - Date.now()),

  verifyPin: async (pin) => {
    const raw = await SecureStore.getItemAsync(PIN_KEY, SECURE_OPTS);
    if (!raw) return { ok: false, reason: 'no-pin' };
    const attempts = await readAttempts();
    const now = Date.now();
    if (attempts.lockUntil > now) return { ok: false, reason: 'locked', retryAt: attempts.lockUntil };

    const { salt, hash } = JSON.parse(raw) as { salt: string; hash: string };
    const candidate = await hashPin(pin, salt, digest);
    if (constantTimeEqual(candidate, hash)) {
      await writeAttempts({ failures: 0, lockUntil: 0 });
      set({ locked: false });
      return { ok: true };
    }
    const failures = attempts.failures + 1;
    const wait = lockoutMs(failures);
    await writeAttempts({ failures, lockUntil: wait > 0 ? now + wait : 0 });
    if (wait > 0) return { ok: false, reason: 'locked', retryAt: now + wait };
    return { ok: false, reason: 'wrong', attemptsLeft: Math.max(0, 5 - failures) };
  },

  unlockWithBiometrics: async () => {
    if (!useSettings.getState().biometricEnabled || !(await get().checkBiometrics())) return false;
    set({ authBusy: true });
    try {
      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock NotiCatch',
        cancelLabel: 'Use PIN',
        disableDeviceFallback: true,
      });
      if (res.success) {
        set({ locked: false });
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      // Let the activity settle before app-state transitions count again.
      setTimeout(() => set({ authBusy: false }), 600);
    }
  },
}));
