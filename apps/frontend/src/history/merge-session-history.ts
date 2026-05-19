import type { SessionHistoryListItem } from '@boulder/api-contract';
import type { SyncQueueItem, SyncQueueStatus } from '../offline/db/types.js';

export type MergedHistorySource = 'server' | 'local';

export interface MergedHistoryItem {
  id: string;
  gymId: string;
  gymName: string;
  startTime: string;
  endTime: string;
  totalDurationMs: number;
  entryCount: number;
  source: MergedHistorySource;
  isLocalOnly: boolean;
  syncStatus?: Extract<SyncQueueStatus, 'pending' | 'error'>;
}

const LOCAL_QUEUE_STATUSES = new Set<SyncQueueStatus>(['pending', 'error']);

const toLocalHistoryItem = (
  item: SyncQueueItem,
  gymNamesById: Readonly<Record<string, string>>,
): MergedHistoryItem => {
  const { payload } = item;

  return {
    id: payload.id,
    gymId: payload.gymId,
    gymName: gymNamesById[payload.gymId] ?? 'Unknown gym',
    startTime: payload.startTime,
    endTime: payload.endTime,
    totalDurationMs: payload.totalDurationMs,
    entryCount: payload.entries.length,
    source: 'local',
    isLocalOnly: true,
    syncStatus: item.status === 'error' ? 'error' : 'pending',
  };
};

/**
 * Merge server history with local pending/error queue sessions on this device.
 * Excludes synced or in-flight queue rows to avoid duplicate history entries.
 */
export const mergeSessionHistory = (
  serverItems: SessionHistoryListItem[],
  queueItems: SyncQueueItem[],
  gymNamesById: Readonly<Record<string, string>> = {},
): MergedHistoryItem[] => {
  const serverIds = new Set(serverItems.map((item) => item.id));

  const localItems = queueItems.flatMap((item) =>
    LOCAL_QUEUE_STATUSES.has(item.status) && !serverIds.has(item.sessionId)
      ? toLocalHistoryItem(item, gymNamesById)
      : [],
  );

  const merged: MergedHistoryItem[] = [
    ...serverItems.map((item) => ({
      id: item.id,
      gymId: item.gymId,
      gymName: item.gymName,
      startTime: item.startTime,
      endTime: item.endTime,
      totalDurationMs: item.totalDurationMs,
      entryCount: item.entryCount,
      source: 'server' as const,
      isLocalOnly: false,
    })),
    ...localItems,
  ];

  merged.sort(
    (left, right) => Date.parse(right.startTime) - Date.parse(left.startTime),
  );

  return merged;
};

/** Whether a local pending group separator should appear before this item. */
export const shouldShowLocalPendingSeparator = (
  items: MergedHistoryItem[],
  index: number,
): boolean => {
  const item = items[index];
  if (!item?.isLocalOnly) {
    return false;
  }

  const previous = items[index - 1];
  return previous === undefined || !previous.isLocalOnly;
};
