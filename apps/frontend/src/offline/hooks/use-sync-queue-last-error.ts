import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database.js';

export const useSyncQueueLastError = (): string | undefined =>
  useLiveQuery(
    async () => {
      const errored = await db.syncQueue
        .where('status')
        .equals('error')
        .sortBy('updatedAt');

      return errored.at(-1)?.lastError;
    },
    [],
    undefined,
  );
