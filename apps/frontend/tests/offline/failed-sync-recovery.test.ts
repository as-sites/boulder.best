import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ACTIVE_DRAFT_SESSION_ID,
  buildFailedSyncExport,
  buildFailedSyncExportFilename,
  clearFailedSyncQueueItem,
  downloadFailedSyncExport,
  draftSessionRepository,
  offlineImagesRepository,
  resetOfflineDatabase,
  syncQueueRepository,
  type OfflineImage,
  type SessionFormValues,
  type SyncQueueItem,
  type SyncSessionPayload,
} from '../../src/offline/index.js';

const syncPayloadFixture = (): SyncSessionPayload => ({
  id: 'session-1',
  gymId: 'gym-1',
  startTime: '2026-05-18T10:00:00Z',
  endTime: '2026-05-18T12:00:00Z',
  totalDurationMs: 7_200_000,
  notes: '',
  entries: [],
});

const queueItemFixture = (
  overrides: Partial<SyncQueueItem> = {},
): SyncQueueItem => ({
  id: 'queue-1',
  sessionId: 'session-1',
  payload: syncPayloadFixture(),
  status: 'error',
  retryCount: 2,
  lastError: 'Network Error',
  createdAt: 1_700_000_000_000,
  updatedAt: 1_700_000_100_000,
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

describe('failed sync recovery', () => {
  beforeEach(async () => {
    await resetOfflineDatabase();
  });

  it('builds export JSON without image blob bytes', async () => {
    const item = queueItemFixture();
    const image = imageFixture();
    await syncQueueRepository.put(item);
    await offlineImagesRepository.put(image);

    const exportData = await buildFailedSyncExport(item);

    expect(exportData.queueItem).toEqual(item);
    expect(exportData.metadata).toEqual({
      lastError: 'Network Error',
      retryCount: 2,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    });
    expect(exportData.offlineImages).toEqual([
      {
        id: image.id,
        sessionId: image.sessionId,
        entryId: image.entryId,
        index: image.index,
        contentType: image.contentType,
      },
    ]);

    const serialized = JSON.stringify(exportData);
    expect(serialized).not.toContain('offline-image');
    expect(serialized).not.toContain('"blob"');
  });

  it('builds a stable export filename prefix', () => {
    expect(buildFailedSyncExportFilename('session-abc')).toMatch(
      /^boulder-failed-sync-session-abc-/,
    );
  });

  it('clears queue item, session images, and matching draft only', async () => {
    const item = queueItemFixture();
    const otherSessionDraft: SessionFormValues = {
      id: 'other-session',
      gymId: null,
      location: null,
      startTime: null,
      endTime: null,
      totalDurationMs: 0,
      notes: '',
      status: 'active',
      entries: [],
    };

    await syncQueueRepository.put(item);
    await offlineImagesRepository.put(imageFixture());
    await draftSessionRepository.saveActive({
      formData: { ...otherSessionDraft },
    });

    await clearFailedSyncQueueItem(item);

    await expect(syncQueueRepository.get(item.id)).resolves.toBeUndefined();
    await expect(
      offlineImagesRepository.listBySession(item.sessionId),
    ).resolves.toEqual([]);
    await expect(draftSessionRepository.getActive()).resolves.toMatchObject({
      id: ACTIVE_DRAFT_SESSION_ID,
      formData: otherSessionDraft,
    });
  });

  it('clears matching draft when session ids match', async () => {
    const item = queueItemFixture();
    await syncQueueRepository.put(item);
    await draftSessionRepository.saveActive({
      formData: {
        id: item.sessionId,
        gymId: null,
        location: null,
        startTime: null,
        endTime: null,
        totalDurationMs: 0,
        notes: '',
        status: 'stopped',
        entries: [],
      },
    });

    await clearFailedSyncQueueItem(item);

    await expect(draftSessionRepository.getActive()).resolves.toBeUndefined();
  });

  it('downloads export via object URL and revokes it', async () => {
    const item = queueItemFixture();
    await syncQueueRepository.put(item);

    const createObjectURL = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:export');
    const revokeObjectURL = vi
      .spyOn(URL, 'revokeObjectURL')
      .mockReturnValue(undefined);
    const click = vi.fn();
    const anchor = {
      href: '',
      download: '',
      rel: '',
      click,
    } as unknown as HTMLAnchorElement;
    const createElement = vi
      .spyOn(document, 'createElement')
      .mockReturnValue(anchor);

    await downloadFailedSyncExport(item);

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(createElement).toHaveBeenCalledWith('a');
    expect(anchor.download).toBe(buildFailedSyncExportFilename(item.sessionId));
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:export');

    createObjectURL.mockRestore();
    revokeObjectURL.mockRestore();
    createElement.mockRestore();

    expect(anchor.download.length).toBeGreaterThan(0);
  });
});
