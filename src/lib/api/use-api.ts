/**
 * Standardized data-fetching hooks for client components.
 *
 *   useApi<T>(url, { refreshInterval })  — SWR-backed read with auto-revalidation
 *   useApiMutation<TBody, TResult>(url, method)  — POST / PATCH / DELETE wrapper
 *
 * Both unwrap the `{ success, data, correlationId }` envelope used by every
 * route (via `successResponse()`) so consumers always work with the payload
 * directly. Both surface a normalized `error` field (Error & { status, code,
 * correlationId }) so handlers can branch on HTTP status or code without
 * parsing the JSON themselves.
 *
 * Use these from Phase 3 onward as the default. The Phase 2 pages use
 * `apiFetcher`/`apiMutate` directly — keep that working; new code prefers
 * the hooks for consistency.
 */

import useSWR, { SWRConfiguration } from 'swr';
import { useCallback, useState } from 'react';
import { apiFetcher, apiMutate } from './fetcher';

export interface ApiError extends Error {
  status?: number;
  code?: string;
  correlationId?: string;
}

export interface UseApiOptions extends Omit<SWRConfiguration, 'fetcher'> {
  /** Convenience alias for `refreshInterval`. Set to `false` to disable polling. */
  pollMs?: number | false;
}

export interface UseApiResult<T> {
  data: T | undefined;
  error: ApiError | undefined;
  isLoading: boolean;
  isValidating: boolean;
  /** Revalidate. Optionally pass new data to update the cache optimistically. */
  refresh: (next?: T) => Promise<T | undefined>;
  /** Underlying SWR mutate — useful when caller wants raw SWRMutator semantics. */
  mutate: ReturnType<typeof useSWR<T>>['mutate'];
}

/**
 * Fetch `url` and revalidate on focus/reconnect/interval. Pass `null` to skip
 * the request (conditional fetching), matching SWR's convention.
 */
export function useApi<T = unknown>(url: string | null, options: UseApiOptions = {}): UseApiResult<T> {
  const { pollMs, ...rest } = options;
  const refreshInterval =
    pollMs === false ? 0
    : typeof pollMs === 'number' ? pollMs
    : rest.refreshInterval;

  const swr = useSWR<T>(url, apiFetcher, {
    ...rest,
    refreshInterval,
  });

  const refresh = useCallback(async (next?: T) => {
    if (typeof next !== 'undefined') {
      return swr.mutate(next, { revalidate: true });
    }
    return swr.mutate();
  }, [swr]);

  return {
    data: swr.data,
    error: swr.error as ApiError | undefined,
    isLoading: swr.isLoading,
    isValidating: swr.isValidating,
    refresh,
    mutate: swr.mutate,
  };
}

export interface UseApiMutationResult<TBody, TResult> {
  /** Fire the mutation. Resolves with the response payload, throws on error. */
  trigger: (body?: TBody) => Promise<TResult>;
  isLoading: boolean;
  error: ApiError | undefined;
  reset: () => void;
}

/**
 * Mutation hook. Holds loading + error state for a single endpoint. The caller
 * is responsible for revalidating any `useApi` keys after success — usually by
 * calling the related `refresh()` in the success handler.
 *
 * If `url` is a function, it's called with the trigger's argument before the
 * request — useful for path params like `/things/:id`.
 */
export function useApiMutation<TBody = unknown, TResult = unknown>(
  url: string | ((body: TBody) => string),
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE' = 'POST',
): UseApiMutationResult<TBody, TResult> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | undefined>(undefined);

  const trigger = useCallback(async (body?: TBody): Promise<TResult> => {
    setIsLoading(true);
    setError(undefined);
    try {
      const resolved = typeof url === 'function' ? url(body as TBody) : url;
      return await apiMutate<TBody | undefined, TResult>(resolved, method, body);
    } catch (err) {
      setError(err as ApiError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [url, method]);

  const reset = useCallback(() => setError(undefined), []);

  return { trigger, isLoading, error, reset };
}
