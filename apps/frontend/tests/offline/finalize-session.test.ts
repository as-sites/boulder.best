import { beforeEach, describe, expect, it } from 'vitest';
import {
  autosaveActiveDraft,
  draftSessionRepository,
  finalizeStoppedSession,
  resetOfflineDatabase,
  restoreActiveDraft,
  syncQueueRepository,
  type SessionFormValues,
} from '../../src/offline/index.js';

const stoppedSessionFixture = (): SessionFormValues => ({
  id: '987fcdeb-51a2-43d7-9012-345678901234',
  gymId: 'a1b2c3d4-e5f6-4789-a234-56789abcdef0',
  location: 'Main Wall',
  startTime: '2026-05-18T10:00:00Z',
  endTime: '2026-05-18T12:00:00Z',
  totalDurationMs: 7_200_000,
  status: 'stopped',
  entries: [
    {
      id: 'climb-1',
      sequenceOrder: 0,
      type: 'climb',
      name: 'Pink corner',
      grade: 'V3',
      completed: true,
      durationMs: 0,
      timer: {
        accumulatedDurationMs: 30_000,
        activeStartTime: null,
        status: 'stopped',
      },
      climbAttempts: [
        {
          sequenceOrder: 0,
          durationMs: 0,
          timer: {
            accumulatedDurationMs: 12_000,
            activeStartTime: null,
            status: 'stopped',
          },
        },
        {
          sequenceOrder: 1,
          durationMs: 5000,
          timer: {
            accumulatedDurationMs: 8000,
            activeStartTime: null,
            status: 'stopped',
          },
        },
      ],
    },
  ],
});

describe('finalize stopped session', () => {
  beforeEach(async () => {
    await resetOfflineDatabase();
  });

  it('enqueues a payload and clears the active draft', async () => {
    const form = stoppedSessionFixture();
    await autosaveActiveDraft(form);

    const queueItem = await finalizeStoppedSession(form);

    expect(queueItem.status).toBe('pending');
    expect(queueItem.payload.location).toBe('Main Wall');
    expect(queueItem.payload.entries[0]).toMatchObject({
      type: 'climb',
      durationMs: 20_000,
      climbAttempts: [
        { sequenceOrder: 0, durationMs: 12_000 },
        { sequenceOrder: 1, durationMs: 8000 },
      ],
    });
    await expect(restoreActiveDraft()).resolves.toBeUndefined();
    await expect(draftSessionRepository.getActive()).resolves.toBeUndefined();
    await expect(syncQueueRepository.get(queueItem.id)).resolves.toEqual(
      queueItem,
    );
  });
});
