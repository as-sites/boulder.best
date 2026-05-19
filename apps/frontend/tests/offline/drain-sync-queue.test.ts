import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SyncSessionPayload } from '@boulder/api-contract';
import {
  drainSyncQueue,
  resetOfflineDatabase,
  syncQueueRepository,
  type SyncQueueItem,
} from '../../src/offline/index.js';

const uploadSessionImages = vi.hoisted(() => vi.fn());

vi.mock(import('../../src/offline/sync/upload-offline-image.js'), () => ({
  uploadOfflineImagesForSession: uploadSessionImages,
}));

const syncPayloadFixture = (): SyncSessionPayload => ({
  id: '987fcdeb-51a2-43d7-9012-345678901234',
  gymId: 'a1b2c3d4-e5f6-4789-a234-56789abcdef0',
  startTime: '2026-05-13T10:00:00.000Z',
  endTime: '2026-05-13T12:00:00.000Z',
  totalDurationMs: 7_200_000,
  entries: [],
});

const queueItemFixture = (
  overrides: Partial<SyncQueueItem> = {},
): SyncQueueItem => ({
  id: 'queue-1',
  sessionId: syncPayloadFixture().id,
  payload: syncPayloadFixture(),
  status: 'pending',
  retryCount: 0,
  createdAt: 1_700_000_000_000,
  updatedAt: 1_700_000_000_000,
  ...overrides,
});

const eligibleContext = {
  manualOfflineMode: false,
  isOnline: true,
  isAuthenticated: true,
  isAppForeground: true,
};

describe('drain sync queue', () => {
  beforeEach(async () => {
    await resetOfflineDatabase();
    uploadSessionImages.mockReset();
    uploadSessionImages.mockResolvedValue([]);
  });

  it('uploads images for eligible queue items', async () => {
    const item = queueItemFixture();
    await syncQueueRepository.put(item);

    await drainSyncQueue(eligibleContext);

    expect(uploadSessionImages).toHaveBeenCalledWith(item.sessionId);
    await expect(syncQueueRepository.get(item.id)).resolves.toMatchObject({
      status: 'pending',
    });
  });

  it('marks queue items as error when image upload fails', async () => {
    const item = queueItemFixture();
    await syncQueueRepository.put(item);
    uploadSessionImages.mockRejectedValue(new Error('Upload failed'));

    await drainSyncQueue(eligibleContext);

    await expect(syncQueueRepository.get(item.id)).resolves.toMatchObject({
      status: 'error',
      lastError: 'Upload failed',
    });
  });

  it('does nothing while manual offline mode is enabled', async () => {
    await syncQueueRepository.put(queueItemFixture());

    await drainSyncQueue({
      ...eligibleContext,
      manualOfflineMode: true,
    });

    expect(uploadSessionImages).not.toHaveBeenCalled();
  });
});
