import type {
  SyncClimbEntry,
  SyncSessionEntry,
  SyncSessionPayload,
} from '@boulder/api-contract';
import { elapsedDurationMs, type TimerNow } from '../../lib/timer/index.js';
import { db } from '../db/database.js';
import type {
  ClimbFormEntry,
  SessionFormEntry,
  SessionFormValues,
  SyncQueueItem,
} from '../db/types.js';
import { draftSessionRepository } from '../repositories/draft-session-repository.js';
import { syncQueueRepository } from '../repositories/sync-queue-repository.js';

const resolveDurationMs = (
  timer: SessionFormEntry['timer'],
  storedDurationMs: number,
  now?: TimerNow,
): number => {
  if (timer.status === 'idle') {
    return storedDurationMs;
  }

  return elapsedDurationMs(timer, now);
};

const toSyncClimbEntry = (
  entry: ClimbFormEntry,
  now?: TimerNow,
): SyncClimbEntry => {
  const climbAttempts = entry.climbAttempts.map((attempt) => ({
    sequenceOrder: attempt.sequenceOrder,
    durationMs: resolveDurationMs(attempt.timer, attempt.durationMs, now),
    notes: attempt.notes,
  }));

  return {
    id: entry.id,
    sequenceOrder: entry.sequenceOrder,
    type: 'climb',
    name: entry.name,
    grade: entry.grade,
    completed: entry.completed,
    notes: entry.notes,
    durationMs: climbAttempts.reduce(
      (total, attempt) => total + attempt.durationMs,
      0,
    ),
    climbAttempts,
    images: [],
  };
};

const toSyncEntry = (
  entry: SessionFormEntry,
  now?: TimerNow,
): SyncSessionEntry => {
  if (entry.type === 'break') {
    return {
      id: entry.id,
      sequenceOrder: entry.sequenceOrder,
      type: 'break',
      durationMs: resolveDurationMs(entry.timer, entry.durationMs, now),
    };
  }

  return toSyncClimbEntry(entry, now);
};

export const buildSyncSessionPayload = (
  form: SessionFormValues,
  now?: TimerNow,
): SyncSessionPayload => {
  if (form.gymId === null || form.startTime === null || form.endTime === null) {
    throw new Error('Stopped session is missing gym or timestamps');
  }

  if (form.status !== 'stopped') {
    throw new Error('Only stopped sessions can be finalized');
  }

  return {
    id: form.id,
    gymId: form.gymId,
    location: form.location ?? undefined,
    startTime: form.startTime,
    endTime: form.endTime,
    totalDurationMs: form.totalDurationMs,
    notes: form.notes,
    entries: form.entries.map((entry) => toSyncEntry(entry, now)),
  };
};

export const finalizeStoppedSession = async (
  form: SessionFormValues,
  now?: TimerNow,
): Promise<SyncQueueItem> => {
  const payload = buildSyncSessionPayload(form, now);
  const timestamp = Date.now();
  const queueItem: SyncQueueItem = {
    id: payload.id,
    sessionId: payload.id,
    payload,
    status: 'pending',
    retryCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.transaction('rw', [db.syncQueue, db.draftSession], async () => {
    await syncQueueRepository.put(queueItem);
    await draftSessionRepository.clearActive();
  });

  return queueItem;
};
