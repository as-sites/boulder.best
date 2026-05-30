import type { SyncQueueItem } from '../db/types.js';
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

/**
 * Stale lease threshold for crash recovery only; routine online sync is owned
 * by SyncQueueCoordinator.
 */
export const SYNCING_STALE_MS = 120_000;

export interface SyncQueueDrainOptions extends SyncQueueRuntimeContext {
  /** When true, retry failed items immediately instead of waiting for backoff. */
  forceRetry?: boolean;
}

export const drainSyncQueue = async (
  context: SyncQueueDrainOptions,
): Promise<void> => {
  const { forceRetry = false, ...runtimeContext } = context;
  if (!canProcessSyncQueue(runtimeContext)) {
    return;
  }

  // Single DB read: only fetch statuses that are actionable.
  const allItems = await syncQueueRepository.listByStatuses([
    'pending',
    'error',
    'syncing',
  ]);

  // Reset only stale `syncing` items (e.g. tab crash after lock release). Recent
  // `syncing` rows may still be uploading in another context without locks.
  // Track updated versions in-memory to avoid a second DB read.
  const now = Date.now();
  const updatedItems: SyncQueueItem[] = [];

  for (const item of allItems) {
    if (item.status === 'syncing') {
      const syncingSince = item.syncingStartedAt ?? item.updatedAt;
      if (now - syncingSince > SYNCING_STALE_MS) {
        const { syncingStartedAt: _syncingStartedAt, ...rest } = item;
        const recovered: SyncQueueItem = {
          ...rest,
          status: 'pending',
          updatedAt: now,
        };
        await syncQueueRepository.put(recovered);
        updatedItems.push(recovered);
        continue;
      }
    }
    updatedItems.push(item);
  }

  const eligible = listEligibleQueueItems(updatedItems, runtimeContext, {
    forceRetry,
  });

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
