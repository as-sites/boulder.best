/**
 * Patterns that identify network / offline fetch failures across browsers.
 * These mirror the Sentry ignore list in `sentry.ts`.
 */
const NETWORK_ERROR_PATTERNS = [
  /^Failed to fetch$/i,
  /^Network Error$/i,
  /^Load failed$/i,
  /^NetworkError when attempting to fetch resource\.?$/i,
  /^The network connection was lost\.?$/i,
];

/**
 * Returns `true` when the thrown value looks like an offline / network error
 * rather than a real server or application error.
 *
 * Covers: - `TypeError` with well-known offline messages (cross-browser) -
 * `DOMException` with name `AbortError` (aborted fetch)
 */
export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return true;
  }

  if (error instanceof TypeError) {
    return (
      NETWORK_ERROR_PATTERNS.some((pattern) => pattern.test(error.message)) ||
      error.message === ''
    );
  }

  return false;
};

/**
 * A network / connectivity error. The device is likely offline or the request
 * was aborted before reaching the server.
 */
export class NetworkOfflineError extends Error {
  public readonly kind = 'offline' as const;

  constructor(cause?: unknown) {
    super('Network request failed — device may be offline', { cause });
    this.name = 'NetworkOfflineError';
  }
}

/**
 * A real server / application error (non-2xx HTTP response or a JSON parse
 * failure on an otherwise successful transport).
 */
export class ApiError extends Error {
  public readonly kind = 'api' as const;

  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export type FetchErrorResult =
  | { kind: 'offline'; error: NetworkOfflineError }
  | { kind: 'api'; error: ApiError };

/**
 * Classify a caught value from a `fetch` / Hono client call into a typed
 * discriminated union.
 *
 * - Network / connectivity issues (TypeError, AbortError, known offline messages)
 *   → `{ kind: 'offline' }`
 * - Everything else (unexpected JS errors, parse failures, etc.) is also wrapped
 *   as `{ kind: 'api', status: 0 }` so callers always get a typed result rather
 *   than re-throwing an unknown.
 *
 * For HTTP-level errors (non-2xx responses) use `apiErrorFromResponse`.
 */
export const classifyFetchError = (error: unknown): FetchErrorResult => {
  if (error instanceof NetworkOfflineError) {
    return { kind: 'offline', error };
  }

  if (isNetworkError(error)) {
    return { kind: 'offline', error: new NetworkOfflineError(error) };
  }

  if (error instanceof ApiError) {
    return { kind: 'api', error };
  }

  const message =
    error instanceof Error ? error.message : 'An unexpected error occurred';
  return { kind: 'api', error: new ApiError(0, message) };
};

/** Build an `ApiError` from a non-ok `Response` object. */
export const apiErrorFromResponse = (response: Response): ApiError =>
  new ApiError(
    response.status,
    `Request failed with status ${response.status}`,
  );
