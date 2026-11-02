import { create } from 'zustand';
import { subscribeToChanges } from '@/data/repository';

interface DataVersionState {
  version: number;
  bump: () => void;
}

/** Screens re-query when this counter changes (native events and local mutations bump it). */
export const useDataVersion = create<DataVersionState>((set) => ({
  version: 0,
  bump: () => set((s) => ({ version: s.version + 1 })),
}));

/** Debounced bridge from native change events to the version counter. Returns a disposer. */
export function startChangeBridge(debounceMs = 300): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const unsubscribe = subscribeToChanges(() => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => useDataVersion.getState().bump(), debounceMs);
  });
  return () => {
    if (timer) clearTimeout(timer);
    unsubscribe();
  };
}
