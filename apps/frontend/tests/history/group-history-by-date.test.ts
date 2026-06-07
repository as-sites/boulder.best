import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { groupHistoryByDate } from '../../src/history/group-history-by-date.js';
import type { MergedHistoryItem } from '../../src/history/merge-session-history.js';

const baseItem = (
  overrides: Partial<MergedHistoryItem>,
): MergedHistoryItem => ({
  id: 'session-1',
  gymId: 'gym-1',
  gymName: 'Test Gym',
  startTime: '2026-05-22T10:00:00.000Z',
  endTime: '2026-05-22T11:00:00.000Z',
  totalDurationMs: 3_600_000,
  entryCount: 1,
  source: 'server',
  isLocalOnly: false,
  ...overrides,
});

describe('history date grouping', () => {
  beforeEach(() => {
    vi.stubEnv('TZ', 'UTC');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('groups items by calendar day and labels today sessions', () => {
    const now = new Date('2026-05-22T15:00:00.000Z');

    const groups = groupHistoryByDate(
      [
        baseItem({
          id: 'today-1',
          startTime: '2026-05-22T10:00:00.000Z',
        }),
        baseItem({
          id: 'today-2',
          startTime: '2026-05-22T18:00:00.000Z',
        }),
        baseItem({
          id: 'yesterday-1',
          startTime: '2026-05-21T12:00:00.000Z',
        }),
      ],
      now,
    );

    expect(groups).toEqual([
      expect.objectContaining({
        label: 'Today',
        items: [
          expect.objectContaining({ id: 'today-1' }),
          expect.objectContaining({ id: 'today-2' }),
        ],
      }),
      expect.objectContaining({
        label: 'Yesterday',
        items: [expect.objectContaining({ id: 'yesterday-1' })],
      }),
    ]);
  });
});
