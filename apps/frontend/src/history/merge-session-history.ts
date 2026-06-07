import type { SessionHistoryListItem } from '@boulder/api-contract';
import type { SyncQueueStatus } from '../offline/db/types.js';
import type { SyncQueueSummary } from '../offline/index.js';

export type MergedHistorySource = 'server' | 'local';

export interface MergedHistoryItem {
  id: string;
  gymId: string;
  gymName: string;
  location?: string | null | undefined;
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
  item: SyncQueueSummary,
  gymNamesById: Readonly<Record<string, string>>,
): MergedHistoryItem => {
  const { payload } = item;

  return {
    id: payload.id,
    gymId: payload.gymId,
    gymName: gymNamesById[payload.gymId] ?? 'Unknown gym',
    location: payload.location,
    startTime: payload.startTime,
    endTime: payload.endTime,
    totalDurationMs: payload.totalDurationMs,
    entryCount: payload.entryCount,
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
  queueItems: SyncQueueSummary[],
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
      location: item.location,
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

/**
 * Whether "On this device" should appear before this item within its render
 * group (e.g. a date section). Shows before the first local-only row in each
 * group, including when local-only sessions span multiple calendar days.
 */
export const shouldShowLocalPendingSeparator = (
  groupItems: MergedHistoryItem[],
  indexInGroup: number,
): boolean => {
  const item = groupItems[indexInGroup];
  if (!item?.isLocalOnly) {
    return false;
  }

  const previousInGroup = groupItems[indexInGroup - 1];
  return previousInGroup === undefined || !previousInGroup.isLocalOnly;
};
