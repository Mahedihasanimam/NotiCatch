import { useCallback, useEffect, useRef, useState } from 'react';
import { queryNotifications } from '@/data/repository';
import type { NotificationRecord, QueryFilter } from '@/lib/types';
import { useDataVersion } from '@/store/dataVersion';
import { messageOf } from './useLiveQuery';

const PAGE = 60;

interface State {
  items: NotificationRecord[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
}

/** Infinite list. Data changes refresh what is already loaded instead of jumping back to page one. */
export function usePagedNotifications(filter: QueryFilter) {
  const version = useDataVersion((s) => s.version);
  const filterKey = JSON.stringify(filter);
  const filterRef = useRef(filter);
  filterRef.current = filter;
  const itemsRef = useRef<NotificationRecord[]>([]);
  const reqId = useRef(0);
  const [state, setState] = useState<State>({ items: [], loading: true, loadingMore: false, hasMore: true, error: null });

  const run = useCallback(async (mode: 'fresh' | 'refresh') => {
    const id = ++reqId.current;
    const limit = mode === 'refresh' ? Math.max(PAGE, itemsRef.current.length) : PAGE;
    if (mode === 'fresh') {
      itemsRef.current = [];
      setState({ items: [], loading: true, loadingMore: false, hasMore: true, error: null });
    }
    try {
      const page = await queryNotifications({ ...filterRef.current, limit, offset: 0 });
      if (id !== reqId.current) return;
      itemsRef.current = page;
      setState({ items: page, loading: false, loadingMore: false, hasMore: page.length === limit, error: null });
    } catch (e) {
      if (id !== reqId.current) return;
      setState((s) => ({ ...s, loading: false, loadingMore: false, error: messageOf(e) }));
    }
  }, []);

  useEffect(() => { void run('fresh'); }, [filterKey, run]);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    void run('refresh');
  }, [version, run]);

  const loadMore = useCallback(async () => {
    if (state.loading || state.loadingMore || !state.hasMore) return;
    const id = ++reqId.current;
    setState((s) => ({ ...s, loadingMore: true }));
    try {
      const page = await queryNotifications({ ...filterRef.current, limit: PAGE, offset: itemsRef.current.length });
      if (id !== reqId.current) return;
      itemsRef.current = [...itemsRef.current, ...page];
      setState({ items: itemsRef.current, loading: false, loadingMore: false, hasMore: page.length === PAGE, error: null });
    } catch (e) {
      if (id !== reqId.current) return;
      setState((s) => ({ ...s, loadingMore: false, error: messageOf(e) }));
    }
  }, [state.loading, state.loadingMore, state.hasMore]);

  return { ...state, loadMore, reload: () => run('fresh') };
}
