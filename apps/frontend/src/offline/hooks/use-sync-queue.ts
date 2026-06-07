import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database.js';
import type { SyncQueueStatus } from '../db/types.js';

export interface SyncQueueStats {
  pending: number;
  error: number;
  syncing: number;
}

/**
 * Slim projection of a SyncQueueItem for use in the history list. Avoids
 * loading full session payloads (which include all climb/break entries) into
 * the React component tree.
 */
export interface SyncQueueSummary {
  id: string;
  sessionId: string;
  status: SyncQueueStatus;
  payload: {
    id: string;
    gymId: string;
    location?: string | null | undefined;
    startTime: string;
    endTime: string;
    totalDurationMs: number;
    /** Pre-computed from payload.entries.length. */
    entryCount: number;
  };
}

const STATS_DEFAULT: SyncQueueStats = { pending: 0, error: 0, syncing: 0 };

/**
 * Single Dexie subscription returning all three queue status counts. Prefer
 * this over calling the individual count hooks when you need multiple counts in
 * the same component tree.
 */
export const useSyncQueueStats = (): SyncQueueStats =>
  useLiveQuery(
    async () => {
      const [pending, error, syncing] = await Promise.all([
        db.syncQueue.where('status').equals('pending').count(),
        db.syncQueue.where('status').equals('error').count(),
        db.syncQueue.where('status').equals('syncing').count(),
      ]);
      return { pending, error, syncing };
    },
    [],
    STATS_DEFAULT,
  );

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

/**
 * Returns a slim summary of each queue item, avoiding the expense of loading
 * full session payloads into the render cycle.
 */
export const useSyncQueueList = (): SyncQueueSummary[] =>
  useLiveQuery(
    async () => {
      const all = await db.syncQueue.orderBy('createdAt').toArray();
      return all.map(({ id, sessionId, status, payload }) => ({
        id,
        sessionId,
        status,
        payload: {
          id: payload.id,
          gymId: payload.gymId,
          location: payload.location,
          startTime: payload.startTime,
          endTime: payload.endTime,
          totalDurationMs: payload.totalDurationMs,
          entryCount: payload.entries.length,
        },
      }));
    },
    [],
    [],
  );

export const useSyncQueueErrorList = (): SyncQueueItem[] =>
  useLiveQuery(
    async () =>
      await db.syncQueue.where('status').equals('error').sortBy('createdAt'),
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
