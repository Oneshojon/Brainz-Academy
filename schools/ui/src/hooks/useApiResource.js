import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Module-level cache shared across all hook instances/mounts. Prevents
 * re-fetching the same resource on every remount (e.g. navigating away
 * from the pricing page and back) — the frontend equivalent of an N+1
 * problem: repeated round trips for data that hasn't changed.
 * @type {Map<string, any>}
 */
const resourceCache = new Map();

/**
 * Clears cached entries whose key starts with `keyPrefix`. Call after a
 * mutation so the next read re-fetches fresh data instead of stale cache.
 * @param {string} keyPrefix
 */
export function invalidateResource(keyPrefix) {
  for (const key of resourceCache.keys()) {
    if (key.startsWith(keyPrefix)) resourceCache.delete(key);
  }
}

/**
 * Fetch-and-cache hook for read-only GET resources.
 * @param {string} cacheKey - Unique key, e.g. 'school-plans'.
 * @param {(signal: AbortSignal) => Promise<any>} fetcher
 * @param {{skip?: boolean}} [options]
 * @returns {{data: any, loading: boolean, error: Error|null, refetch: () => void}}
 */
export function useApiResource(cacheKey, fetcher, { skip = false } = {}) {
  const [data, setData] = useState(() => resourceCache.get(cacheKey) ?? null);
  const [loading, setLoading] = useState(!skip && !resourceCache.has(cacheKey));
  const [error, setError] = useState(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(
    async ({ force = false, signal } = {}) => {
      if (skip) return;
      if (!force && resourceCache.has(cacheKey)) {
        setData(resourceCache.get(cacheKey));
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const result = await fetcherRef.current(signal);
        resourceCache.set(cacheKey, result);
        setData(result);
      } catch (err) {
        if (err?.name !== 'AbortError') setError(err);
      } finally {
        setLoading(false);
      }
    },
    [cacheKey, skip],
  );

  useEffect(() => {
    const controller = new AbortController();
    load({ signal: controller.signal });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, skip]);

  return { data, loading, error, refetch: () => load({ force: true }) };
}

/**
 * Mutation hook for POST/PATCH/PUT/DELETE calls — tracks in-flight state
 * for spinner/disabled UI, and surfaces the thrown ApiError (with
 * `.fieldErrors`) for form-level display.
 * @param {(...args: any[]) => Promise<any>} mutationFn
 */
export function useApiMutation(mutationFn) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fnRef = useRef(mutationFn);
  fnRef.current = mutationFn;

  const mutate = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      return await fnRef.current(...args);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutate, loading, error };
}