import { describe, expect, it } from 'vitest';
import type { SessionHistoryListItem } from '@boulder/api-contract';
import {
  mergeSessionHistory,
  shouldShowLocalPendingSeparator,
} from '../../src/history/merge-session-history.js';
import type { SyncQueueSummary } from '../../src/offline/hooks/use-sync-queue.js';

const serverItem = (
  overrides: Partial<SessionHistoryListItem> = {},
): SessionHistoryListItem => ({
  id: 'server-1',
  gymId: 'gym-1',
  gymName: 'Main Gym',
  location: 'Main Wall',
  startTime: '2026-05-20T12:00:00.000Z',
  endTime: '2026-05-20T13:00:00.000Z',
  totalDurationMs: 3_600_000,
  entryCount: 2,
  ...overrides,
});

const queueItemFixture = (
  overrides: Partial<SyncQueueSummary> = {},
): SyncQueueSummary => ({
  id: 'queue-1',
  sessionId: 'local-1',
  status: 'pending',
  payload: {
    id: 'local-1',
    gymId: 'gym-2',
    location: 'Annex',
    startTime: '2026-05-21T10:00:00.000Z',
    endTime: '2026-05-21T11:00:00.000Z',
    totalDurationMs: 3_600_000,
    entryCount: 1,
  },
  ...overrides,
});

describe('session history merge', () => {
  it('merges server and local pending/error sessions newest-first', () => {
    const merged = mergeSessionHistory(
      [serverItem()],
      [
        queueItemFixture(),
        queueItemFixture({
          id: 'queue-2',
          sessionId: 'local-2',
          status: 'error',
          payload: {
            id: 'local-2',
            gymId: 'gym-2',
            location: 'Annex',
            startTime: '2026-05-19T08:00:00.000Z',
            endTime: '2026-05-19T09:00:00.000Z',
            totalDurationMs: 3_600_000,
            entryCount: 1,
          },
        }),
      ],
      { 'gym-2': 'Annex' },
    );

    expect(merged.map((item) => item.id)).toEqual([
      'local-1',
      'server-1',
      'local-2',
    ]);
    expect(merged[0]).toMatchObject({
      source: 'local',
      isLocalOnly: true,
      syncStatus: 'pending',
      gymName: 'Annex',
      location: 'Annex',
    });
    expect(merged[2]?.syncStatus).toBe('error');
  });

  it('excludes synced queue items and server-visible duplicates', () => {
    const merged = mergeSessionHistory(
      [serverItem({ id: 'session-dup' })],
      [
        queueItemFixture({
          sessionId: 'session-dup',
          status: 'pending',
          payload: {
            id: 'session-dup',
            gymId: 'gym-2',
            location: 'Annex',
            startTime: '2026-05-21T10:00:00.000Z',
            endTime: '2026-05-21T11:00:00.000Z',
            totalDurationMs: 3_600_000,
            entryCount: 1,
          },
        }),
        queueItemFixture({
          id: 'queue-synced',
          sessionId: 'synced-only',
          status: 'synced',
          payload: {
            id: 'synced-only',
            gymId: 'gym-2',
            location: 'Annex',
            startTime: '2026-05-21T10:00:00.000Z',
            endTime: '2026-05-21T11:00:00.000Z',
            totalDurationMs: 3_600_000,
            entryCount: 1,
          },
        }),
      ],
    );

    expect(merged).toHaveLength(1);
    expect(merged[0]?.id).toBe('session-dup');
    expect(merged[0]?.isLocalOnly).toBe(false);
  });
});

describe('local pending separator', () => {
  it('shows a separator before the first local-only row after server rows', () => {
    const merged = mergeSessionHistory(
      [
        serverItem({
          startTime: '2026-05-21T12:00:00.000Z',
          endTime: '2026-05-21T13:00:00.000Z',
        }),
      ],
      [
        queueItemFixture({
          payload: {
            id: 'local-1',
            gymId: 'gym-2',
            location: 'Annex',
            startTime: '2026-05-20T10:00:00.000Z',
            endTime: '2026-05-20T11:00:00.000Z',
            totalDurationMs: 3_600_000,
            entryCount: 1,
          },
        }),
      ],
      { 'gym-2': 'Annex' },
    );

    expect(merged[0]?.isLocalOnly).toBe(false);
    expect(merged[1]?.isLocalOnly).toBe(true);
    expect(shouldShowLocalPendingSeparator(merged, 1)).toBe(true);
    expect(shouldShowLocalPendingSeparator(merged, 0)).toBe(false);
  });
});
