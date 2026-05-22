import type { SyncSessionPayload } from '@boulder/api-contract';
import { apiClient } from '../../lib/api-client.js';
import type { OfflineImage } from '../db/types.js';
import { attachSyncedImagesToPayload } from './attach-synced-images.js';
import { normalizeSyncSessionPayload } from './normalize-sync-payload.js';

export const buildSessionSyncPayload = (
  payload: SyncSessionPayload,
  uploadedImages: OfflineImage[],
): SyncSessionPayload =>
  attachSyncedImagesToPayload(
    normalizeSyncSessionPayload(payload),
    uploadedImages,
  );

export const submitSyncSession = async (
  payload: SyncSessionPayload,
  uploadedImages: OfflineImage[],
): Promise<void> => {
  const response = await apiClient.api.sessions.sync.$post({
    json: buildSessionSyncPayload(payload, uploadedImages),
  });

  if (!response.ok) {
    throw new Error(`Session sync failed (${response.status})`);
  }
};
