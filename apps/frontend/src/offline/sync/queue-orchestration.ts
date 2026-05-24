import {
  canAutoSync,
  type SyncEligibilityInput,
} from '../../lib/settings/sync-eligibility.js';
import type { SyncQueueItem } from '../db/types.js';

const BASE_RETRY_DELAY_MS = 30_000;
const MAX_RETRY_DELAY_MS = 60 * 60 * 1000;

export interface SyncQueueRuntimeContext extends SyncEligibilityInput {
  /** Whether the app is in the foreground (sync only while open). */
  isAppForeground: boolean;
}

export const canProcessSyncQueue = (
  context: SyncQueueRuntimeContext,
): boolean => canAutoSync(context) && context.isAppForeground;

export const isQueueItemReadyForAttempt = (
  item: SyncQueueItem,
  now = Date.now(),
  forceRetry = false,
): boolean => {
  if (item.status === 'pending') {
    return true;
  }

  if (item.status === 'error') {
    return (
      forceRetry || item.nextRetryAt === undefined || item.nextRetryAt <= now
    );
  }

  return false;
};

export const listEligibleQueueItems = (
  items: SyncQueueItem[],
  context: SyncQueueRuntimeContext,
  options: { forceRetry?: boolean; now?: number } = {},
): SyncQueueItem[] => {
  const { forceRetry = false, now = Date.now() } = options;

  if (!canProcessSyncQueue(context)) {
    return [];
  }

  return items.filter(
    (item) =>
      (item.status === 'pending' || item.status === 'error') &&
      isQueueItemReadyForAttempt(item, now, forceRetry),
  );
};

export const computeNextRetryAt = (
  retryCount: number,
  now = Date.now(),
): number => {
  const delayMs = Math.min(
    BASE_RETRY_DELAY_MS * 2 ** Math.max(retryCount - 1, 0),
    MAX_RETRY_DELAY_MS,
  );
  return now + delayMs;
};

export const markQueueItemSyncing = (
  { lastError: _lastError, nextRetryAt: _nextRetryAt, ...rest }: SyncQueueItem,
  now = Date.now(),
): SyncQueueItem => ({
  ...rest,
  status: 'syncing',
  updatedAt: now,
});

export const markQueueItemError = (
  item: SyncQueueItem,
  errorMessage: string,
  now = Date.now(),
): SyncQueueItem => ({
  ...item,
  status: 'error',
  retryCount: item.retryCount + 1,
  lastError: errorMessage,
  nextRetryAt: computeNextRetryAt(item.retryCount + 1, now),
  updatedAt: now,
});

export const markQueueItemSynced = (
  { lastError: _lastError, nextRetryAt: _nextRetryAt, ...rest }: SyncQueueItem,
  now = Date.now(),
): SyncQueueItem => ({
  ...rest,
  status: 'synced',
  updatedAt: now,
});
