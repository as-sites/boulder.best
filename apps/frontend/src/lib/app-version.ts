import { useQuery } from '@tanstack/react-query';

/**
 * The git SHA baked into the current JS bundle at build time. This equals the
 * version of the service worker that was active when this page first loaded
 * (skipWaiting + clientsClaim means SW and bundle are always co-deployed).
 */
export const LOADED_VERSION: string = __APP_VERSION__;

/**
 * Truncates a full git SHA to 7 chars for display; passes non-SHA values
 * through as-is.
 */
export const formatVersion = (sha: string): string =>
  /^[0-9a-f]{8,}$/i.test(sha) ? sha.slice(0, 7) : sha;

const fetchLatestVersion = async (): Promise<string> => {
  const r = await fetch('/version.json', { cache: 'no-store' });
  if (!r.ok) {
    throw new Error('version.json unavailable');
  }
  const data = (await r.json()) as { version: string };
  return data.version;
};

/**
 * Fetches /version.json from the network (no SW cache) to get the version of
 * the latest deployed build. Returns null while loading or when offline.
 */
export const useLatestVersion = (): string | null => {
  const { data } = useQuery({
    queryKey: ['app-version'],
    queryFn: fetchLatestVersion,
    // No need to refetch — the version only changes on a new SW install, at
    // which point needRefresh fires and the banner mounts fresh anyway.
    staleTime: Infinity,
    retry: false,
  });

  return data ?? null;
};
