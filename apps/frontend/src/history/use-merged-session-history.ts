import { useMemo } from 'react';
import type { Gym } from '@boulder/api-contract';
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

  const items = useMemo((): MergedHistoryItem[] => {
    if (!historyQuery.data) {
      return [];
    }

    return mergeSessionHistory(
      historyQuery.data.items,
      queueItems,
      toGymNamesById(gymsQuery.data ?? []),
    );
  }, [gymsQuery.data, historyQuery.data, queueItems]);

  return {
    items,
    historyQuery,
    gymsQuery,
  };
};
