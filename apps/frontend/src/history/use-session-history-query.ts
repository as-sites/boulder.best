import type { SessionHistoryListResponse } from '@boulder/api-contract';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client.js';
import { authClient } from '../lib/auth-client.js';

export const sessionHistoryQueryKey = ['session-history'] as const;

export const fetchSessionHistory =
  async (): Promise<SessionHistoryListResponse> => {
    const response = await apiClient.api.sessions.$get({
      query: { limit: 50 },
    });

    if (!response.ok) {
      throw new Error(`Failed to load session history (${response.status})`);
    }

    return await response.json();
  };

export const useSessionHistoryQuery = () => {
  const session = authClient.useSession();
  const isAuthenticated = Boolean(session.data?.user);

  return useQuery({
    queryKey: sessionHistoryQueryKey,
    queryFn: fetchSessionHistory,
    enabled: isAuthenticated,
  });
};
