import { create } from 'zustand';
import { isAccessGranted, isNativeAvailable, requestRebind } from '@/data/repository';

interface AccessState {
  nativeAvailable: boolean;
  granted: boolean;
  checked: boolean;
  refresh: () => Promise<boolean>;
}

export const useAccess = create<AccessState>((set) => ({
  nativeAvailable: isNativeAvailable(),
  granted: false,
  checked: false,
  refresh: async () => {
    const available = isNativeAvailable();
    let granted = false;
    try {
      granted = available ? await isAccessGranted() : false;
      // After a force-stop or OEM kill the system may not have re-bound the listener. The native
      // side only forces a rebind when the listener is actually disconnected, so this is cheap
      // to do on every refresh (app start / return to foreground).
      if (granted) {
        await requestRebind().catch(() => undefined);
      }
    } catch {
      granted = false;
    }
    set({ nativeAvailable: available, granted, checked: true });
    return granted;
  },
}));
