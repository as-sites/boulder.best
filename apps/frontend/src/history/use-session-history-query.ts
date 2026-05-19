import type { SessionHistoryListResponse } from '@boulder/api-contract';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client.js';

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

export const useSessionHistoryQuery = () =>
  useQuery({
    queryKey: sessionHistoryQueryKey,
    queryFn: fetchSessionHistory,
  });
