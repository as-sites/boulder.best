import { describe, expect, it } from 'vitest';
import type { SyncSessionPayload } from '@boulder/api-contract';
import {
  computeNextRetryAt,
  listEligibleQueueItems,
  markQueueItemError,
  markQueueItemSyncing,
  type SyncQueueItem,
  type SyncQueueRuntimeContext,
} from '../../src/offline/index.js';

const payloadFixture = (): SyncSessionPayload => ({
  id: 'session-1',
  gymId: 'gym-1',
  startTime: '2026-05-18T10:00:00Z',
  endTime: '2026-05-18T12:00:00Z',
  totalDurationMs: 7_200_000,
  entries: [],
});

const queueItemFixture = (
  overrides: Partial<SyncQueueItem> = {},
): SyncQueueItem => ({
  id: 'queue-1',
  sessionId: 'session-1',
  payload: payloadFixture(),
  status: 'pending',
  retryCount: 0,
  createdAt: 1_700_000_000_000,
  updatedAt: 1_700_000_000_000,
  ...overrides,
});

const eligibleContext = (
  overrides: Partial<SyncQueueRuntimeContext> = {},
): SyncQueueRuntimeContext => ({
  manualOfflineMode: false,
  isOnline: true,
  isAuthenticated: true,
  isAppForeground: true,
  ...overrides,
});

describe('queue orchestration', () => {
  it('returns no eligible items when manual offline mode is enabled', () => {
    const items = [queueItemFixture()];

    expect(
      listEligibleQueueItems(
        items,
        eligibleContext({ manualOfflineMode: true }),
      ),
    ).toEqual([]);
  });

  it('returns no eligible items when the browser is offline', () => {
    const items = [queueItemFixture()];

    expect(
      listEligibleQueueItems(items, eligibleContext({ isOnline: false })),
    ).toEqual([]);
  });

  it('skips error items until nextRetryAt', () => {
    const now = 1_700_000_000_000;
    const items = [
      queueItemFixture({
        status: 'error',
        retryCount: 1,
        nextRetryAt: now + 60_000,
      }),
    ];

    expect(listEligibleQueueItems(items, eligibleContext(), { now })).toEqual(
      [],
    );
  });

  it('includes backoff error items when forceRetry is set', () => {
    const now = 1_700_000_000_000;
    const backoffError = queueItemFixture({
      status: 'error',
      retryCount: 1,
      nextRetryAt: now + 60_000,
    });

    expect(
      listEligibleQueueItems([backoffError], eligibleContext(), {
        forceRetry: true,
        now,
      }),
    ).toEqual([backoffError]);
  });

  it('includes retry-ready error items and pending items', () => {
    const now = 1_700_000_000_000;
    const pending = queueItemFixture({ id: 'pending-1' });
    const retryReady = queueItemFixture({
      id: 'error-1',
      status: 'error',
      retryCount: 2,
      nextRetryAt: now - 1,
    });

    expect(
      listEligibleQueueItems([pending, retryReady], eligibleContext(), {
        now,
      }),
    ).toEqual([pending, retryReady]);
  });

  it('marks syncing and error transitions with backoff metadata', () => {
    const now = 1_700_000_000_000;
    const syncing = markQueueItemSyncing(queueItemFixture(), now);
    expect(syncing.status).toBe('syncing');

    const errored = markQueueItemError(syncing, 'Network Error', now);
    expect(errored).toMatchObject({
      status: 'error',
      retryCount: 1,
      lastError: 'Network Error',
      nextRetryAt: computeNextRetryAt(1, now),
    });
  });
});
