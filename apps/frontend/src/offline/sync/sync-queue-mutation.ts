import {
  drainSyncQueue,
  type SyncQueueDrainOptions,
} from './drain-sync-queue.js';

export const syncQueueMutationKey = ['sync-queue', 'drain'] as const;

const SYNC_QUEUE_LOCK_NAME = 'boulder-sync-queue';

export const runSyncQueueDrain = async (
  options: SyncQueueDrainOptions,
): Promise<void> => {
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;

  if (locks) {
    await locks.request(
      SYNC_QUEUE_LOCK_NAME,
      { mode: 'exclusive' },
      async () => {
        await drainSyncQueue(options);
      },
    );
    return;
  }

  await drainSyncQueue(options);
};
