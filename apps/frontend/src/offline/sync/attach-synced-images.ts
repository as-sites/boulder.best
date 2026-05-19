import type { SyncSessionPayload } from '@boulder/api-contract';
import type { OfflineImage } from '../db/types.js';
import { toSyncedImage } from './upload-offline-image.js';

export const attachSyncedImagesToPayload = (
  payload: SyncSessionPayload,
  images: OfflineImage[],
): SyncSessionPayload => {
  const imagesByEntryId = new Map<
    string,
    Array<ReturnType<typeof toSyncedImage>>
  >();

  for (const image of images) {
    const synced = toSyncedImage(image);
    const entryImages = imagesByEntryId.get(image.entryId) ?? [];
    entryImages.push(synced);
    imagesByEntryId.set(image.entryId, entryImages);
  }

  for (const [entryId, entryImages] of imagesByEntryId) {
    imagesByEntryId.set(
      entryId,
      entryImages.sort((left, right) => left.index - right.index),
    );
  }

  return {
    ...payload,
    entries: payload.entries.map((entry) => {
      if (entry.type !== 'climb') {
        return entry;
      }

      return {
        ...entry,
        images: imagesByEntryId.get(entry.id) ?? [],
      };
    }),
  };
};
