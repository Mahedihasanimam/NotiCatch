import { create } from 'zustand';
import { isAccessGranted, isNativeAvailable, requestRebind } from '@/data/repository';

interface AccessState {
  nativeAvailable: boolean;
  granted: boolean;
  checked: boolean;
  refresh: () => Promise<boolean>;
}

let rebound = false;

export const useAccess = create<AccessState>((set) => ({
  nativeAvailable: isNativeAvailable(),
  granted: false,
  checked: false,
  refresh: async () => {
    const available = isNativeAvailable();
    let granted = false;
    try {
      granted = available ? await isAccessGranted() : false;
      // After a force-stop or OEM kill the system may not have re-bound us; ask once per process.
      if (granted && !rebound) {
        rebound = true;
        await requestRebind().catch(() => undefined);
      }
    } catch {
      granted = false;
    }
    set({ nativeAvailable: available, granted, checked: true });
    return granted;
  },
}));
