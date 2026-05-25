import { useMemo } from 'react';
import type { Gym } from '@boulder/api-contract';
import { ApiError, NetworkOfflineError } from '../lib/fetch-error.js';
import { useSyncQueueList } from '../offline/index.js';
import { useCachedGymsQuery } from '../tracker/use-cached-gyms-query.js';
import {
  mergeSessionHistory,
  type MergedHistoryItem,
} from './merge-session-history.js';
import { useSessionHistoryQuery } from './use-session-history-query.js';

const toGymNamesById = (gyms: Gym[]): Record<string, string> =>
  Object.fromEntries(gyms.map((gym) => [gym.id, gym.name]));

export const useMergedSessionHistory = () => {
  const historyQuery = useSessionHistoryQuery();
  const gymsQuery = useCachedGymsQuery();
  const queueItems = useSyncQueueList();

  const isAuthenticated = historyQuery.isSuccess;
  const isUnauthorized =
    historyQuery.error instanceof ApiError && historyQuery.error.status === 401;

  // Treat a network/offline failure as "no server data" rather than a hard
  // error so that local queue items are still shown without a PageError.
  const isOfflineError = historyQuery.error instanceof NetworkOfflineError;

  const items = useMemo((): MergedHistoryItem[] => {
    const serverItems = historyQuery.data?.items ?? [];

    return mergeSessionHistory(
      serverItems,
      queueItems,
      toGymNamesById(gymsQuery.data ?? []),
    );
  }, [gymsQuery.data, historyQuery.data, queueItems]);

  return {
    items,
    historyQuery: {
      ...historyQuery,
      // Surface as error only for real API failures, not offline or signed-out 401.
      isError: historyQuery.isError && !isOfflineError && !isUnauthorized,
    },
    gymsQuery,
    isAuthenticated,
  };
};
