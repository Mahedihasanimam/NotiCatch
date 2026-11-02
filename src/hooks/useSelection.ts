import { useCallback, useMemo, useState } from 'react';

export function useSelection() {
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set());
  const toggle = useCallback((id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);
  const clear = useCallback(() => setSelected(new Set()), []);
  const selectAll = useCallback((ids: number[]) => setSelected(new Set(ids)), []);
  const ids = useMemo(() => [...selected], [selected]);
  return { selected, ids, count: selected.size, active: selected.size > 0, toggle, clear, selectAll };
}
