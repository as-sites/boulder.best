import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database.js';
import type { SyncQueueItem } from '../db/types.js';

export const useSyncQueuePendingCount = (): number =>
  useLiveQuery(
    async () => await db.syncQueue.where('status').equals('pending').count(),
    [],
    0,
  );

export const useSyncQueueErrorCount = (): number =>
  useLiveQuery(
    async () => await db.syncQueue.where('status').equals('error').count(),
    [],
    0,
  );

export const useSyncQueueList = (): SyncQueueItem[] =>
  useLiveQuery(
    async () => await db.syncQueue.orderBy('createdAt').toArray(),
    [],
    [],
  );

/** Whether the queue has sessions that manual sync can process. */
export const useSyncQueueHasWork = (): boolean =>
  useLiveQuery(
    async () => {
      const [pending, error, syncing] = await Promise.all([
        db.syncQueue.where('status').equals('pending').count(),
        db.syncQueue.where('status').equals('error').count(),
        db.syncQueue.where('status').equals('syncing').count(),
      ]);
      return pending + error + syncing > 0;
    },
    [],
    false,
  );
