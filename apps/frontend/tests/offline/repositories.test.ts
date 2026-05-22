import { beforeEach, describe, expect, it } from 'vitest';
import {
  ACTIVE_DRAFT_SESSION_ID,
  cachedGymsRepository,
  draftSessionRepository,
  offlineImagesRepository,
  resetOfflineDatabase,
  syncQueueRepository,
  type Gym,
  type OfflineImage,
  type SessionFormValues,
  type SyncQueueItem,
  type SyncSessionPayload,
} from '../../src/offline/index.js';

const gymFixture = (): Gym => ({
  id: 'a1b2c3d4-e5f6-4789-a234-56789abcdef0',
  name: 'Test Gym',
  grades: ['V0', 'V1'],
  locations: ['Main Wall'],
  updatedAt: '2026-05-13T08:00:00.000Z',
});

const sessionFormFixture = (): SessionFormValues => ({
  id: 'session-1',
  gymId: 'gym-1',
  location: null,
  startTime: '2026-05-18T10:00:00Z',
  endTime: null,
  totalDurationMs: 0,
  status: 'active',
  entries: [],
});

const syncPayloadFixture = (): SyncSessionPayload => ({
  id: 'session-1',
  gymId: 'gym-1',
  startTime: '2026-05-18T10:00:00Z',
  endTime: '2026-05-18T12:00:00Z',
  totalDurationMs: 7_200_000,
  entries: [
    {
      id: 'entry-1',
      sequenceOrder: 0,
      durationMs: 45_000,
      type: 'climb',
      name: 'Pink corner',
      grade: 'V3',
      climbAttempts: [
        { sequenceOrder: 0, durationMs: 12_000, completed: true },
        { sequenceOrder: 1, durationMs: 12_000 },
      ],
      images: [],
    },
  ],
});

const queueItemFixture = (
  overrides: Partial<SyncQueueItem> = {},
): SyncQueueItem => ({
  id: 'queue-1',
  sessionId: 'session-1',
  payload: syncPayloadFixture(),
  status: 'pending',
  retryCount: 0,
  createdAt: 1_700_000_000_000,
  updatedAt: 1_700_000_000_000,
  ...overrides,
});

const imageFixture = (): OfflineImage => ({
  id: 'image-1',
  sessionId: 'session-1',
  entryId: 'entry-1',
  index: 0,
  blob: new Blob(['offline-image'], { type: 'image/jpeg' }),
  contentType: 'image/jpeg',
  contentLength: 13,
  createdAt: 1_700_000_000_000,
  uploadStatus: 'pending',
});

describe('offline repositories', () => {
  beforeEach(async () => {
    await resetOfflineDatabase();
  });

  describe('cached gyms', () => {
    it('creates, reads, updates, and deletes gyms', async () => {
      const gym = gymFixture();

      await cachedGymsRepository.put(gym);
      await expect(cachedGymsRepository.get(gym.id)).resolves.toEqual(gym);

      const updated: Gym = {
        ...gym,
        name: 'Updated Gym',
        grades: ['V2', 'V3'],
        locations: ['Annex'],
        updatedAt: '2026-05-13T09:00:00.000Z',
      };
      await cachedGymsRepository.put(updated);
      await expect(cachedGymsRepository.get(gym.id)).resolves.toEqual(updated);

      await cachedGymsRepository.delete(gym.id);
      await expect(cachedGymsRepository.get(gym.id)).resolves.toBeUndefined();
    });
  });

  describe('draft session', () => {
    it('creates, reads, updates, and deletes the active draft', async () => {
      const formData = sessionFormFixture();

      await draftSessionRepository.saveActive({
        formData,
        lastSavedAt: 100,
      });

      await expect(draftSessionRepository.getActive()).resolves.toEqual({
        id: ACTIVE_DRAFT_SESSION_ID,
        formData,
        lastSavedAt: 100,
      });

      const updatedFormData: SessionFormValues = {
        ...formData,
        notes: 'Feeling strong',
      };
      await draftSessionRepository.saveActive({
        formData: updatedFormData,
        lastSavedAt: 200,
      });

      await expect(draftSessionRepository.getActive()).resolves.toEqual({
        id: ACTIVE_DRAFT_SESSION_ID,
        formData: updatedFormData,
        lastSavedAt: 200,
      });

      await draftSessionRepository.clearActive();
      await expect(draftSessionRepository.getActive()).resolves.toBeUndefined();
    });
  });

  describe('sync queue', () => {
    it('creates, reads, updates, and deletes queue items', async () => {
      const item = queueItemFixture();

      await syncQueueRepository.put(item);
      await expect(syncQueueRepository.get(item.id)).resolves.toEqual(item);

      const updated: SyncQueueItem = {
        ...item,
        status: 'error',
        retryCount: 2,
        lastError: 'Network Error',
        nextRetryAt: item.updatedAt + 60_000,
        updatedAt: item.updatedAt + 1,
      };
      await syncQueueRepository.put(updated);
      await expect(syncQueueRepository.get(item.id)).resolves.toEqual(updated);
      await expect(syncQueueRepository.listByStatus('error')).resolves.toEqual([
        updated,
      ]);

      await syncQueueRepository.delete(item.id);
      await expect(syncQueueRepository.get(item.id)).resolves.toBeUndefined();
    });

    it('lists all items chronologically', async () => {
      const pending = queueItemFixture({
        id: 'pending-1',
        createdAt: 100,
        updatedAt: 100,
      });
      const errorItem: SyncQueueItem = {
        ...queueItemFixture({
          id: 'error-1',
          createdAt: 200,
          updatedAt: 200,
        }),
        status: 'error',
        retryCount: 1,
        lastError: 'Network Error',
      };

      await syncQueueRepository.put(pending);
      await syncQueueRepository.put(errorItem);

      await expect(
        syncQueueRepository.listByStatus('pending'),
      ).resolves.toEqual([pending]);
      await expect(syncQueueRepository.listByStatus('error')).resolves.toEqual([
        errorItem,
      ]);
      await expect(syncQueueRepository.listAll()).resolves.toEqual([
        pending,
        errorItem,
      ]);
    });
  });

  describe('offline images', () => {
    it('creates, reads, updates, and deletes image blobs separately from session JSON', async () => {
      const image = imageFixture();

      await offlineImagesRepository.put(image);
      const stored = await offlineImagesRepository.get(image.id);
      expect(stored).toMatchObject({
        id: image.id,
        sessionId: image.sessionId,
        entryId: image.entryId,
        index: image.index,
        contentType: image.contentType,
        contentLength: image.contentLength,
        createdAt: image.createdAt,
      });
      expect(stored?.blob.type).toBe('image/jpeg');
      await expect(
        offlineImagesRepository.listByEntry(image.sessionId, image.entryId),
      ).resolves.toHaveLength(1);

      const updated: OfflineImage = {
        ...image,
        index: 1,
        contentLength: 20,
        blob: new Blob(['updated-offline-image'], { type: 'image/png' }),
        contentType: 'image/png',
      };
      await offlineImagesRepository.put(updated);
      const updatedStored = await offlineImagesRepository.get(image.id);
      expect(updatedStored).toMatchObject({
        index: 1,
        contentType: 'image/png',
        contentLength: 20,
      });
      expect(updatedStored?.blob.type).toBe('image/png');

      const payload = syncPayloadFixture();
      expect(JSON.stringify(payload)).not.toContain('blob');
      expect(JSON.stringify(payload)).not.toContain('updated-offline-image');

      await offlineImagesRepository.delete(image.id);
      await expect(
        offlineImagesRepository.get(image.id),
      ).resolves.toBeUndefined();
    });
  });
});
