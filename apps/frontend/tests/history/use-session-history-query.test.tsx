import { describe, expect, it, vi } from 'vitest';
import type { JSX, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import {
  fetchSessionHistory,
  useSessionHistoryQuery,
} from '../../src/history/use-session-history-query.js';
import { apiClient } from '../../src/lib/api-client.js';
import { ApiError } from '../../src/lib/fetch-error.js';

vi.mock(
  import('../../src/lib/api-client.js'),
  () =>
    ({
      apiClient: {
        api: {
          sessions: {
            $get: vi.fn(),
          },
        },
      },
    }) as unknown as { apiClient: typeof apiClient },
);

const sessionsGet = vi.mocked(apiClient.api.sessions.$get);

type SessionsGetResponse = Awaited<ReturnType<typeof sessionsGet>>;

const createWrapper = (queryClient: QueryClient) => {
  const Wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

describe(fetchSessionHistory, () => {
  it('throws ApiError for 401 responses', async () => {
    sessionsGet.mockResolvedValueOnce(
      new Response(null, { status: 401 }) as SessionsGetResponse,
    );

    await expect(fetchSessionHistory()).rejects.toBeInstanceOf(ApiError);
  });
});

describe(useSessionHistoryQuery, () => {
  it('fetches immediately without waiting on useSession', async () => {
    sessionsGet.mockResolvedValueOnce(
      Response.json({ items: [], nextCursor: null }) as SessionsGetResponse,
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const { result } = renderHook(() => useSessionHistoryQuery(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(sessionsGet).toHaveBeenCalled();
    expect(result.current.data).toEqual({ items: [], nextCursor: null });
  });
});
