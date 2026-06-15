/**
 * SWR-compatible fetcher used across client pages. Unwraps the
 * `{ success, data, correlationId }` envelope returned by `successResponse()`
 * so consumers never need to peel `.data` themselves.
 *
 * Throws on non-2xx with the API's error payload so SWR's `error` field is
 * meaningful.
 */
export async function apiFetcher<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(body?.message || `Request failed: ${res.status}`);
    (err as any).status = res.status;
    (err as any).code = body?.code;
    (err as any).correlationId = body?.correlationId;
    throw err;
  }
  return (body?.data ?? body) as T;
}

export async function apiMutate<TBody, TResult = unknown>(
  url: string,
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  body?: TBody,
): Promise<TResult> {
  const res = await fetch(url, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(json?.message || `Request failed: ${res.status}`);
    (err as any).status = res.status;
    (err as any).code = json?.code;
    (err as any).correlationId = json?.correlationId;
    throw err;
  }
  return (json?.data ?? json) as TResult;
}
