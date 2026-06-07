import { db } from '../db/database.js';
import type { OfflineImage, SyncQueueItem } from '../db/types.js';
import { draftSessionRepository } from '../repositories/draft-session-repository.js';
import { offlineImagesRepository } from '../repositories/offline-images-repository.js';
import { syncQueueRepository } from '../repositories/sync-queue-repository.js';

export type FailedSyncExportImageMeta = Pick<
  OfflineImage,
  'id' | 'sessionId' | 'entryId' | 'index' | 'contentType'
>;

export interface FailedSyncExport {
  exportedAt: string;
  queueItem: SyncQueueItem;
  metadata: {
    lastError?: string;
    retryCount: number;
    createdAt: number;
    updatedAt: number;
  };
  offlineImages: FailedSyncExportImageMeta[];
}

export const toFailedSyncExportImageMeta = (
  image: OfflineImage,
): FailedSyncExportImageMeta => ({
  id: image.id,
  sessionId: image.sessionId,
  entryId: image.entryId,
  index: image.index,
  contentType: image.contentType,
});

export const buildFailedSyncExport = async (
  item: SyncQueueItem,
): Promise<FailedSyncExport> => {
  const images = await offlineImagesRepository.listBySession(item.sessionId);

  const metadata: FailedSyncExport['metadata'] = {
    retryCount: item.retryCount,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
  if (item.lastError !== undefined) {
    metadata.lastError = item.lastError;
  }

  return {
    exportedAt: new Date().toISOString(),
    queueItem: item,
    metadata,
    offlineImages: images.map((image) => toFailedSyncExportImageMeta(image)),
  };
};

export const buildFailedSyncExportFilename = (sessionId: string): string => {
  const stamp = new Date()
    .toISOString()
    .replaceAll(':', '-')
    .replace(/\.\d{3}Z$/, 'Z');
  return `boulder-failed-sync-${sessionId}-${stamp}.json`;
};

export const downloadFailedSyncExport = async (
  item: SyncQueueItem,
): Promise<void> => {
  const exportData = await buildFailedSyncExport(item);
  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = buildFailedSyncExportFilename(item.sessionId);
    anchor.rel = 'noopener';
    anchor.click();
  } finally {
    URL.revokeObjectURL(url);
  }
};

export const clearFailedSyncQueueItem = async (
  item: SyncQueueItem,
): Promise<void> => {
  const { sessionId, id: queueItemId } = item;

  await db.transaction(
    'rw',
    db.syncQueue,
    db.offlineImages,
    db.draftSession,
    async () => {
      await syncQueueRepository.delete(queueItemId);
      await offlineImagesRepository.deleteBySessionId(sessionId);

      const draft = await draftSessionRepository.getActive();
      if (draft?.formData.id === sessionId) {
        await draftSessionRepository.clearActive();
      }
    },
  );
};
