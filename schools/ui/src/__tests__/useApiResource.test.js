import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useApiResource, invalidateResource } from '../hooks/useApiResource';

describe('useApiResource', () => {
  beforeEach(() => invalidateResource(''));

  it('starts loading, then resolves with data', async () => {
    const fetcher = vi.fn().mockResolvedValue({ value: 42 });
    const { result } = renderHook(() => useApiResource('test-key', fetcher));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ value: 42 });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('serves cached data on a second mount without re-fetching', async () => {
    const fetcher = vi.fn().mockResolvedValue({ value: 1 });
    const first = renderHook(() => useApiResource('cached-key', fetcher));
    await waitFor(() => expect(first.result.current.loading).toBe(false));

    const second = renderHook(() => useApiResource('cached-key', fetcher));
    expect(second.result.current.loading).toBe(false);
    expect(second.result.current.data).toEqual({ value: 1 });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('captures errors without throwing', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('network down'));
    const { result } = renderHook(() => useApiResource('error-key', fetcher));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error?.message).toBe('network down');
    expect(result.current.data).toBeNull();
  });

  it('refetch forces a cache bypass', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce({ value: 1 }).mockResolvedValueOnce({ value: 2 });
    const { result } = renderHook(() => useApiResource('refetch-key', fetcher));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => result.current.refetch());
    await waitFor(() => expect(result.current.data).toEqual({ value: 2 }));
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});