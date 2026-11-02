import { useCallback, useEffect, useRef, useState } from 'react';
import { useDataVersion } from '@/store/dataVersion';

export const messageOf = (e: unknown): string => (e instanceof Error ? e.message : String(e));

export interface LiveQuery<T> {
  data: T | undefined;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/** Runs `fn` on mount, when `deps` change and whenever stored data changes. Stale results are dropped. */
export function useLiveQuery<T>(fn: () => Promise<T>, deps: readonly unknown[]): LiveQuery<T> {
  const version = useDataVersion((s) => s.version);
  const [state, setState] = useState<{ data: T | undefined; loading: boolean; error: string | null }>({
    data: undefined, loading: true, error: null,
  });
  const reqId = useRef(0);
  const [manual, setManual] = useState(0);

  useEffect(() => {
    const id = ++reqId.current;
    setState((s) => ({ ...s, loading: s.data === undefined, error: null }));
    fn().then(
      (data) => id === reqId.current && setState({ data, loading: false, error: null }),
      (e: unknown) => id === reqId.current && setState((s) => ({ ...s, loading: false, error: messageOf(e) })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, manual, ...deps]);

  const reload = useCallback(() => setManual((n) => n + 1), []);
  return { ...state, reload };
}
