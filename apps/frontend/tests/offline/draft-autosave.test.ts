import { beforeEach, describe, expect, it } from 'vitest';
import {
  ACTIVE_DRAFT_SESSION_ID,
  autosaveActiveDraft,
  createIdleTimer,
  resetOfflineDatabase,
  restoreActiveDraft,
  type SessionFormValues,
} from '../../src/offline/index.js';

const sessionFormFixture = (): SessionFormValues => ({
  id: 'session-1',
  gymId: 'a1b2c3d4-e5f6-4789-a234-56789abcdef0',
  location: null,
  startTime: '2026-05-18T10:00:00Z',
  endTime: null,
  totalDurationMs: 0,
  notes: '',
  status: 'active',
  deletedEntryIds: [],
  entries: [
    {
      id: 'climb-1',
      sequenceOrder: 0,
      type: 'climb',
      name: 'Pink corner',
      grade: 'V3',
      notes: '',
      durationMs: 0,
      timer: createIdleTimer(),
      climbAttempts: [
        {
          sequenceOrder: 0,
          durationMs: 0,
          notes: 'Crux felt hard',
          timer: {
            accumulatedDurationMs: 4000,
            activeStartTime: '2026-05-18T10:05:00Z',
            status: 'running',
          },
        },
      ],
    },
  ],
});

const activeSessionWithoutEntriesFixture = (): SessionFormValues => ({
  id: 'session-zero-entries',
  gymId: 'a1b2c3d4-e5f6-4789-a234-56789abcdef0',
  location: 'Main Wall',
  startTime: '2026-05-18T10:00:00Z',
  endTime: null,
  totalDurationMs: 0,
  notes: 'Warming up',
  status: 'active',
  deletedEntryIds: [],
  entries: [],
});

const preStartSessionFixture = (): SessionFormValues => ({
  id: 'session-pre-start',
  gymId: 'a1b2c3d4-e5f6-4789-a234-56789abcdef0',
  location: 'Cave',
  startTime: null,
  endTime: null,
  totalDurationMs: 0,
  notes: 'Planning projects',
  status: 'not_started',
  deletedEntryIds: [],
  entries: [],
});

describe('draft autosave', () => {
  beforeEach(async () => {
    await resetOfflineDatabase();
  });

  it('restores gym, entries, notes, and attempt timer state after refresh', async () => {
    const formData = sessionFormFixture();

    await autosaveActiveDraft(formData);
    await expect(restoreActiveDraft()).resolves.toEqual({
      id: ACTIVE_DRAFT_SESSION_ID,
      formData,
      lastSavedAt: expect.any(Number),
    });
  });

  it('restores an active session with zero entries after refresh', async () => {
    const formData = activeSessionWithoutEntriesFixture();

    await autosaveActiveDraft(formData);
    await expect(restoreActiveDraft()).resolves.toEqual({
      id: ACTIVE_DRAFT_SESSION_ID,
      formData,
      lastSavedAt: expect.any(Number),
    });
  });

  it('restores pre-start gym, location, and notes after refresh', async () => {
    const formData = preStartSessionFixture();

    await autosaveActiveDraft(formData);
    await expect(restoreActiveDraft()).resolves.toEqual({
      id: ACTIVE_DRAFT_SESSION_ID,
      formData,
      lastSavedAt: expect.any(Number),
    });
  });
});
