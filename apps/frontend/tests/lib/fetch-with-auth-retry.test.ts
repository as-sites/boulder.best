import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authClient } from '../../src/lib/auth-client.js';
import { fetchWithAuthRetry } from '../../src/lib/fetch-with-auth-retry';

vi.mock(
  import('../../src/lib/auth-client.js'),
  () =>
    ({
      authClient: {
        getSession: vi.fn(),
      },
    }) as unknown as { authClient: typeof authClient },
);

const getSession = vi.mocked(authClient.getSession);

describe(fetchWithAuthRetry, () => {
  const mockFetch = vi.fn<typeof fetch>();

  beforeEach(() => {
    mockFetch.mockReset();
    getSession.mockReset();
    vi.spyOn(globalThis, 'fetch').mockImplementation(mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns non-401 responses without calling getSession', async () => {
    const response = new Response('ok', { status: 200 });
    mockFetch.mockResolvedValueOnce(response);

    const result = await fetchWithAuthRetry('https://api.example.com/sessions');

    expect(result).toBe(response);
    expect(mockFetch).toHaveBeenCalledOnce();
    expect(getSession).not.toHaveBeenCalled();
  });

  it('retries once when 401 is followed by a restored session', async () => {
    const unauthorized = new Response(null, { status: 401 });
    const success = new Response('ok', { status: 200 });
    mockFetch
      .mockResolvedValueOnce(unauthorized)
      .mockResolvedValueOnce(success);
    getSession.mockResolvedValueOnce({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    const result = await fetchWithAuthRetry(
      'https://api.example.com/sessions',
      {
        method: 'GET',
      },
    );

    expect(result).toBe(success);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(getSession).toHaveBeenCalledWith({
      query: { disableCookieCache: true },
    });
  });

  it('returns the original 401 when session refresh finds no user', async () => {
    const unauthorized = new Response(null, { status: 401 });
    mockFetch.mockResolvedValueOnce(unauthorized);
    getSession.mockResolvedValueOnce({ data: null, error: null });

    const result = await fetchWithAuthRetry('https://api.example.com/sessions');

    expect(result).toBe(unauthorized);
    expect(result.status).toBe(401);
    expect(mockFetch).toHaveBeenCalledOnce();
    expect(getSession).toHaveBeenCalledOnce();
  });

  it('does not retry on 403', async () => {
    const forbidden = new Response(null, { status: 403 });
    mockFetch.mockResolvedValueOnce(forbidden);

    const result = await fetchWithAuthRetry('https://api.example.com/sessions');

    expect(result).toBe(forbidden);
    expect(mockFetch).toHaveBeenCalledOnce();
    expect(getSession).not.toHaveBeenCalled();
  });
});
