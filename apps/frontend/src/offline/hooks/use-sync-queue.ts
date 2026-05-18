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
