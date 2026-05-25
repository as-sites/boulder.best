import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SyncSessionPayload } from '@boulder/api-contract';
import {
  drainSyncQueue,
  resetOfflineDatabase,
  SYNCING_STALE_MS,
  syncQueueRepository,
  type SyncQueueItem,
} from '../../src/offline/index.js';

const uploadSessionImages = vi.hoisted(() => vi.fn());
const submitSession = vi.hoisted(() => vi.fn());

vi.mock(import('../../src/offline/sync/upload-offline-image.js'), () => ({
  uploadOfflineImagesForSession: uploadSessionImages,
}));

vi.mock(import('../../src/offline/sync/submit-sync-session.js'), () => ({
  submitSyncSession: submitSession,
}));

const syncPayloadFixture = (): SyncSessionPayload => ({
  id: '987fcdeb-51a2-43d7-9012-345678901234',
  gymId: 'a1b2c3d4-e5f6-4789-a234-56789abcdef0',
  startTime: '2026-05-13T10:00:00.000Z',
  endTime: '2026-05-13T12:00:00.000Z',
  totalDurationMs: 7_200_000,
  notes: '',
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
    submitSession.mockReset();
    submitSession.mockResolvedValue(undefined);
  });

  it('uploads images and submits the session for eligible queue items', async () => {
    const item = queueItemFixture();
    const uploadedImages = [{ id: 'image-1' }];
    await syncQueueRepository.put(item);
    uploadSessionImages.mockResolvedValue(uploadedImages);

    await drainSyncQueue(eligibleContext);

    expect(uploadSessionImages).toHaveBeenCalledWith(item.sessionId);
    expect(submitSession).toHaveBeenCalledWith(item.payload, uploadedImages);
    await expect(syncQueueRepository.get(item.id)).resolves.toMatchObject({
      status: 'synced',
    });
  });

  it('marks queue items as error when image upload fails', async () => {
    const item = queueItemFixture();
    await syncQueueRepository.put(item);
    uploadSessionImages.mockRejectedValue(new Error('Upload failed'));

    await drainSyncQueue(eligibleContext);

    expect(submitSession).not.toHaveBeenCalled();
    await expect(syncQueueRepository.get(item.id)).resolves.toMatchObject({
      status: 'error',
      lastError: 'Upload failed',
    });
  });

  it('marks queue items as error when session sync fails', async () => {
    const item = queueItemFixture();
    await syncQueueRepository.put(item);
    submitSession.mockRejectedValue(new Error('Session sync failed'));

    await drainSyncQueue(eligibleContext);

    await expect(syncQueueRepository.get(item.id)).resolves.toMatchObject({
      status: 'error',
      lastError: 'Session sync failed',
    });
  });

  it('retries failed items immediately when forceRetry is set', async () => {
    const item = queueItemFixture({
      status: 'error',
      retryCount: 1,
      lastError: 'Session sync failed',
      nextRetryAt: Date.now() + 60_000,
    });
    await syncQueueRepository.put(item);
    submitSession.mockResolvedValue(undefined);

    await drainSyncQueue({ ...eligibleContext, forceRetry: true });

    expect(submitSession).toHaveBeenCalledWith(item.payload, []);
    await expect(syncQueueRepository.get(item.id)).resolves.toMatchObject({
      status: 'synced',
    });
  });

  it('does not retry backoff error items without forceRetry', async () => {
    const item = queueItemFixture({
      status: 'error',
      retryCount: 1,
      lastError: 'Session sync failed',
      nextRetryAt: Date.now() + 60_000,
    });
    await syncQueueRepository.put(item);

    await drainSyncQueue(eligibleContext);

    expect(submitSession).not.toHaveBeenCalled();
  });

  it('does not recover a recently syncing queue item', async () => {
    const now = Date.now();
    const item = queueItemFixture({
      status: 'syncing',
      syncingStartedAt: now - 1000,
      updatedAt: now - 1000,
    });
    await syncQueueRepository.put(item);

    await drainSyncQueue(eligibleContext);

    expect(uploadSessionImages).not.toHaveBeenCalled();
    await expect(syncQueueRepository.get(item.id)).resolves.toMatchObject({
      status: 'syncing',
    });
  });

  it('recovers a stale syncing queue item and processes it', async () => {
    const now = Date.now();
    const item = queueItemFixture({
      status: 'syncing',
      syncingStartedAt: now - SYNCING_STALE_MS - 1000,
      updatedAt: now - SYNCING_STALE_MS - 1000,
    });
    await syncQueueRepository.put(item);

    await drainSyncQueue(eligibleContext);

    expect(uploadSessionImages).toHaveBeenCalledWith(item.sessionId);
    await expect(syncQueueRepository.get(item.id)).resolves.toMatchObject({
      status: 'synced',
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
