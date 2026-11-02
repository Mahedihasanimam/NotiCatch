import type { KeepsakeNativeModule } from '@native';

/**
 * Loads the Kotlin module lazily. In environments without the custom dev build (Expo Go, web,
 * unit tests that do not mock it) this resolves to null and the UI shows an explanatory state.
 */
let cached: KeepsakeNativeModule | null | undefined;

export function getNative(): KeepsakeNativeModule | null {
  if (cached !== undefined) return cached;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = (require('@native') as { default: KeepsakeNativeModule }).default;
  } catch {
    cached = null;
  }
  return cached;
}

export function requireNative(): KeepsakeNativeModule {
  const n = getNative();
  if (!n) throw new Error('The native notification module is unavailable. Use a custom development build on Android.');
  return n;
}

/** Test hook. */
export function __resetNativeCache(): void {
  cached = undefined;
}
