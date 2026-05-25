import type { SessionHistoryListResponse } from '@boulder/api-contract';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client.js';
import {
  NetworkOfflineError,
  apiErrorFromResponse,
  isNetworkError,
} from '../lib/fetch-error.js';

export const sessionHistoryQueryKey = ['session-history'] as const;

export const fetchSessionHistory =
  async (): Promise<SessionHistoryListResponse> => {
    let response: Response;
    try {
      response = await apiClient.api.sessions.$get({
        query: { limit: 50 },
      });
    } catch (error) {
      if (isNetworkError(error)) {
        throw new NetworkOfflineError(error);
      }
      throw error;
    }

    if (!response.ok) {
      throw apiErrorFromResponse(response);
    }

    return await response.json();
  };

export const useSessionHistoryQuery = () =>
  useQuery({
    queryKey: sessionHistoryQueryKey,
    queryFn: fetchSessionHistory,
  });
