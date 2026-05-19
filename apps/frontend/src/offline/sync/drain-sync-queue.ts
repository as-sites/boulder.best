import { syncQueueRepository } from '../repositories/sync-queue-repository.js';
import {
  canProcessSyncQueue,
  listEligibleQueueItems,
  markQueueItemError,
  markQueueItemSynced,
  markQueueItemSyncing,
  type SyncQueueRuntimeContext,
} from './queue-orchestration.js';
import { submitSyncSession } from './submit-sync-session.js';
import { uploadOfflineImagesForSession } from './upload-offline-image.js';

export const drainSyncQueue = async (
  context: SyncQueueRuntimeContext,
): Promise<void> => {
  if (!canProcessSyncQueue(context)) {
    return;
  }

  const items = await syncQueueRepository.listAll();
  const eligible = listEligibleQueueItems(items, context);

  for (const item of eligible) {
    const syncing = markQueueItemSyncing(item);
    await syncQueueRepository.put(syncing);

    try {
      const uploadedImages = await uploadOfflineImagesForSession(
        item.sessionId,
      );
      await submitSyncSession(item.payload, uploadedImages);
      await syncQueueRepository.put(markQueueItemSynced(item));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Sync failed unexpectedly';
      await syncQueueRepository.put(markQueueItemError(item, message));
    }
  }
};
