import Dexie from 'dexie';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database.js';

export const useSyncQueueLastError = (): string | undefined =>
  useLiveQuery(
    async () => {
      // Use the [status+updatedAt] compound index to directly retrieve the
      // most-recently-updated error row without loading the full error set.
      const last = await db.syncQueue
        .where('[status+updatedAt]')
        .between(['error', Dexie.minKey], ['error', Dexie.maxKey])
        .last();

      return last?.lastError;
    },
    [],
    undefined,
  );
