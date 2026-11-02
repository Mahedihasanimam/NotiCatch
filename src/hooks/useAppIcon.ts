import { useEffect, useState } from 'react';
import { getAppIcon } from '@/data/repository';

const cache = new Map<string, string | null>();
const inflight = new Map<string, Promise<string | null>>();

function load(pkg: string): Promise<string | null> {
  const existing = inflight.get(pkg);
  if (existing) return existing;
  const p = getAppIcon(pkg)
    .catch(() => null)
    .then((b64) => {
      cache.set(pkg, b64);
      inflight.delete(pkg);
      return b64;
    });
  inflight.set(pkg, p);
  return p;
}

/** Base64 PNG for the app icon, or null if it has none / is not visible to us. */
export function useAppIcon(packageName: string): string | null {
  const [icon, setIcon] = useState<string | null>(cache.get(packageName) ?? null);
  useEffect(() => {
    let alive = true;
    if (cache.has(packageName)) setIcon(cache.get(packageName) ?? null);
    else load(packageName).then((b) => alive && setIcon(b));
    return () => { alive = false; };
  }, [packageName]);
  return icon;
}
