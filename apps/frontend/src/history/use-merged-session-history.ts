import { useMemo } from 'react';
import type { Gym } from '@boulder/api-contract';
import { authClient } from '../lib/auth-client.js';
import { NetworkOfflineError } from '../lib/fetch-error.js';
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
  const session = authClient.useSession();
  const isAuthenticated = Boolean(session.data?.user);
  const historyQuery = useSessionHistoryQuery();
  const gymsQuery = useCachedGymsQuery();
  const queueItems = useSyncQueueList();

  // Treat a network/offline failure as "no server data" rather than a hard
  // error so that local queue items are still shown without a PageError.
  const isOfflineError = historyQuery.error instanceof NetworkOfflineError;

  const items = useMemo((): MergedHistoryItem[] => {
    const serverItems = isAuthenticated ? (historyQuery.data?.items ?? []) : [];

    return mergeSessionHistory(
      serverItems,
      queueItems,
      toGymNamesById(gymsQuery.data ?? []),
    );
  }, [gymsQuery.data, historyQuery.data, isAuthenticated, queueItems]);

  const isHistoryLoading = isAuthenticated && historyQuery.isPending;

  return {
    items,
    historyQuery: {
      ...historyQuery,
      isPending: isHistoryLoading,
      // Surface as error only for real API failures, not offline disconnects.
      isError: isAuthenticated && historyQuery.isError && !isOfflineError,
    },
    gymsQuery,
    isAuthenticated,
  };
};
