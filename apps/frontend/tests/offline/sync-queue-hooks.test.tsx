import { beforeEach, describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  resetOfflineDatabase,
  syncQueueRepository,
  useSyncQueueErrorCount,
  useSyncQueueList,
  useSyncQueuePendingCount,
  type SyncQueueItem,
  type SyncSessionPayload,
} from '../../src/offline/index.js';

const syncPayloadFixture = (): SyncSessionPayload => ({
  id: 'session-1',
  gymId: 'a1b2c3d4-e5f6-4789-a234-56789abcdef0',
  startTime: '2026-05-18T10:00:00Z',
  endTime: '2026-05-18T12:00:00Z',
  totalDurationMs: 7_200_000,
  notes: '',
  deletedEntryIds: [],
  entries: [],
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

describe('sync queue live query hooks', () => {
  beforeEach(async () => {
    await resetOfflineDatabase();
  });

  it('reports pending and error counts from IndexedDB', async () => {
    await syncQueueRepository.put(queueItemFixture({ id: 'pending-1' }));
    await syncQueueRepository.put(
      queueItemFixture({
        id: 'error-1',
        status: 'error',
        retryCount: 1,
        lastError: 'Network Error',
      }),
    );

    const { result: pending } = renderHook(() => useSyncQueuePendingCount());
    const { result: errors } = renderHook(() => useSyncQueueErrorCount());

    await waitFor(() => {
      expect(pending.current).toBe(1);
    });
    expect(errors.current).toBe(1);
  });

  it('lists queue items in createdAt order', async () => {
    await syncQueueRepository.put(
      queueItemFixture({ id: 'older', createdAt: 100, updatedAt: 100 }),
    );
    await syncQueueRepository.put(
      queueItemFixture({ id: 'newer', createdAt: 200, updatedAt: 200 }),
    );

    const { result } = renderHook(() => useSyncQueueList());

    await waitFor(() => {
      expect(result.current.map((item) => item.id)).toEqual(['older', 'newer']);
    });
    expect(result.current).toHaveLength(2);
  });
});
