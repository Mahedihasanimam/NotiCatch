export type Digest = (input: string) => Promise<string>;

export const PIN_MIN = 4;
export const PIN_MAX = 8;
export const HASH_ROUNDS = 1500;
export const FREE_ATTEMPTS = 5;
export const MAX_LOCKOUT_MS = 15 * 60_000;

export const isValidPin = (pin: string): boolean => new RegExp(`^\\d{${PIN_MIN},${PIN_MAX}}$`).test(pin);

/** Salted, iterated SHA-256. The digest is injected so the logic is testable without native code. */
export async function hashPin(pin: string, salt: string, digest: Digest, rounds: number = HASH_ROUNDS): Promise<string> {
  let h = `${salt}:${pin}`;
  for (let i = 0; i < rounds; i++) h = await digest(`${h}:${salt}`);
  return h;
}

/** Compares without early exit on the first differing character. */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Wrong-PIN backoff: free attempts, then 30s doubling up to 15 minutes. */
export function lockoutMs(failures: number): number {
  if (failures < FREE_ATTEMPTS) return 0;
  return Math.min(MAX_LOCKOUT_MS, 30_000 * 2 ** (failures - FREE_ATTEMPTS));
}
