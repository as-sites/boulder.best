import type {
  SyncClimbEntry,
  SyncSessionPayload,
  SyncSessionSuccessResponse,
} from '@boulder/api-contract';
import { eq } from 'drizzle-orm';
import type { AppDb } from '../db/index.js';
import {
  climbAttempts,
  gyms,
  sessionEntries,
  sessionEntryImages,
  sessions,
} from '../db/schema.js';

export class SyncSessionForbiddenError extends Error {
  public readonly name = 'SyncSessionForbiddenError';
  public readonly status = 403;

  constructor() {
    super('Session belongs to another user');
  }
}

export class SyncSessionInvalidLocationError extends Error {
  public readonly name = 'SyncSessionInvalidLocationError';
  public readonly status = 400;

  constructor() {
    super('Location must be null or one of the selected gym locations');
  }
}

const assertValidSessionLocation = (
  location: string | null | undefined,
  gymLocations: ReadonlyArray<string>,
): void => {
  if (location === null || location === undefined) {
    return;
  }

  if (!gymLocations.includes(location)) {
    throw new SyncSessionInvalidLocationError();
  }
};

export const syncSession = async (
  db: AppDb,
  userId: string,
  payload: SyncSessionPayload,
): Promise<SyncSessionSuccessResponse> => {
  const [existingSession] = await db
    .select({ userId: sessions.userId })
    .from(sessions)
    .where(eq(sessions.id, payload.id))
    .limit(1);

  if (existingSession && existingSession.userId !== userId) {
    throw new SyncSessionForbiddenError();
  }

  const [gym] = await db
    .select({ locations: gyms.locations })
    .from(gyms)
    .where(eq(gyms.id, payload.gymId))
    .limit(1);

  if (!gym) {
    throw new SyncSessionInvalidLocationError();
  }

  assertValidSessionLocation(payload.location, gym.locations);

  const sessionLocation = payload.location ?? null;
  const startTime = new Date(payload.startTime);
  const endTime = new Date(payload.endTime);
  const now = new Date();

  await db
    .insert(sessions)
    .values({
      id: payload.id,
      userId,
      gymId: payload.gymId,
      location: sessionLocation,
      startTime,
      endTime,
      totalDurationMs: payload.totalDurationMs,
      notes: payload.notes ?? null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: sessions.id,
      set: {
        gymId: payload.gymId,
        location: sessionLocation,
        startTime,
        endTime,
        totalDurationMs: payload.totalDurationMs,
        notes: payload.notes ?? null,
        updatedAt: now,
      },
    });

  for (const entry of payload.entries) {
    if (entry.type === 'climb') {
      await upsertClimbEntry(db, {
        userId,
        sessionId: payload.id,
        entry,
        now,
      });
      continue;
    }

    await upsertBreakEntry(db, {
      userId,
      sessionId: payload.id,
      entry,
      now,
    });
  }

  return { success: true, sessionId: payload.id };
};

const upsertBreakEntry = async (
  db: AppDb,
  {
    userId,
    sessionId,
    entry,
    now,
  }: {
    userId: string;
    sessionId: string;
    entry: Extract<SyncSessionPayload['entries'][number], { type: 'break' }>;
    now: Date;
  },
) => {
  await db
    .insert(sessionEntries)
    .values({
      id: entry.id,
      sessionId,
      userId,
      sequenceOrder: entry.sequenceOrder,
      type: 'break',
      durationMs: entry.durationMs,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: sessionEntries.id,
      set: {
        sequenceOrder: entry.sequenceOrder,
        durationMs: entry.durationMs,
        updatedAt: now,
      },
    });
};

const upsertClimbEntry = async (
  db: AppDb,
  {
    userId,
    sessionId,
    entry,
    now,
  }: {
    userId: string;
    sessionId: string;
    entry: SyncClimbEntry;
    now: Date;
  },
) => {
  await db
    .insert(sessionEntries)
    .values({
      id: entry.id,
      sessionId,
      userId,
      sequenceOrder: entry.sequenceOrder,
      type: 'climb',
      durationMs: entry.durationMs,
      name: entry.name,
      grade: entry.grade,
      notes: entry.notes ?? null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: sessionEntries.id,
      set: {
        sequenceOrder: entry.sequenceOrder,
        durationMs: entry.durationMs,
        name: entry.name,
        grade: entry.grade,
        notes: entry.notes ?? null,
        updatedAt: now,
      },
    });

  for (const image of entry.images) {
    await db
      .insert(sessionEntryImages)
      .values({
        id: image.id,
        sessionId,
        entryId: entry.id,
        userId,
        imageIndex: image.index,
        objectKey: image.objectKey,
        photoUrl: image.photoUrl,
        contentType: image.contentType,
        contentLength: image.contentLength,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: sessionEntryImages.id,
        set: {
          sessionId,
          entryId: entry.id,
          imageIndex: image.index,
          objectKey: image.objectKey,
          photoUrl: image.photoUrl,
          contentType: image.contentType,
          contentLength: image.contentLength,
          updatedAt: now,
        },
      });
  }

  for (const attempt of entry.climbAttempts) {
    await db
      .insert(climbAttempts)
      .values({
        entryId: entry.id,
        sequenceOrder: attempt.sequenceOrder,
        durationMs: attempt.durationMs,
        completed: attempt.completed ?? null,
        notes: attempt.notes ?? null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [climbAttempts.entryId, climbAttempts.sequenceOrder],
        set: {
          durationMs: attempt.durationMs,
          completed: attempt.completed ?? null,
          notes: attempt.notes ?? null,
          updatedAt: now,
        },
      });
  }
};
