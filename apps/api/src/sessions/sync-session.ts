import type {
  SyncClimbEntry,
  SyncSessionPayload,
  SyncSessionSuccessResponse,
} from '@boulder/api-contract';
import { and, eq, inArray, not, or, sql } from 'drizzle-orm';
import type { AppDb } from '../db/index.js';
import {
  climbAttempts,
  gyms,
  sessionEntries,
  sessionEntryImages,
  sessions,
} from '../db/schema.js';
import { assertValidSyncedImagesForEntry } from './sync-session-image-metadata.js';

export { SyncSessionInvalidImageMetadataError } from './sync-session-image-metadata.js';

export class SyncSessionForbiddenError extends Error {
  public readonly name = 'SyncSessionForbiddenError';
  public readonly status = 403;

  constructor() {
    super('Session belongs to another user');
  }
}

export class SyncSessionConflictError extends Error {
  public readonly name = 'SyncSessionConflictError';
  public readonly status = 403;

  constructor() {
    super('One or more child records belong to another session or user');
  }
}

export class SyncSessionInvalidLocationError extends Error {
  public readonly name = 'SyncSessionInvalidLocationError';
  public readonly status = 400;

  constructor() {
    super('Location must be null or one of the selected gym locations');
  }
}

export class SyncSessionInvalidTimeRangeError extends Error {
  public readonly name = 'SyncSessionInvalidTimeRangeError';
  public readonly status = 400;

  constructor() {
    super('Session endTime must be greater than or equal to startTime');
  }
}

type SyncSessionWriter = Pick<AppDb, 'insert' | 'select'>;
type SyncBatchItem = Parameters<AppDb['batch']>[0][number];

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

const collectEntryIds = (payload: SyncSessionPayload): string[] =>
  payload.entries.map((entry) => entry.id);

const collectImageIds = (payload: SyncSessionPayload): string[] =>
  payload.entries.flatMap((entry) =>
    entry.type === 'climb' ? entry.images.map((image) => image.id) : [],
  );

const assertChildIdsOwnedBySession = async (
  db: SyncSessionWriter,
  {
    userId,
    sessionId,
    entryIds,
    imageIds,
  }: {
    userId: string;
    sessionId: string;
    entryIds: string[];
    imageIds: string[];
  },
): Promise<void> => {
  if (entryIds.length > 0) {
    const conflictingEntries = await db
      .select({ id: sessionEntries.id })
      .from(sessionEntries)
      .where(
        and(
          inArray(sessionEntries.id, entryIds),
          or(
            not(eq(sessionEntries.userId, userId)),
            not(eq(sessionEntries.sessionId, sessionId)),
          ),
        ),
      )
      .limit(1);

    if (conflictingEntries.length > 0) {
      throw new SyncSessionConflictError();
    }
  }

  if (imageIds.length > 0) {
    const conflictingImages = await db
      .select({ id: sessionEntryImages.id })
      .from(sessionEntryImages)
      .where(
        and(
          inArray(sessionEntryImages.id, imageIds),
          or(
            not(eq(sessionEntryImages.userId, userId)),
            not(eq(sessionEntryImages.sessionId, sessionId)),
          ),
        ),
      )
      .limit(1);

    if (conflictingImages.length > 0) {
      throw new SyncSessionConflictError();
    }
  }
};

const ownedEntryConflictGuard = (userId: string, sessionId: string) =>
  sql`${sessionEntries.userId} = ${userId} and ${sessionEntries.sessionId} = ${sessionId}`;

const ownedImageConflictGuard = (userId: string, sessionId: string) =>
  sql`${sessionEntryImages.userId} = ${userId} and ${sessionEntryImages.sessionId} = ${sessionId}`;

const ownedAttemptConflictGuard = (userId: string, sessionId: string) =>
  sql`exists (
    select 1
    from ${sessionEntries}
    where ${sessionEntries.id} = ${climbAttempts.entryId}
      and ${sessionEntries.userId} = ${userId}
      and ${sessionEntries.sessionId} = ${sessionId}
  )`;

const buildBreakEntryUpsert = (
  db: SyncSessionWriter,
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
): SyncBatchItem =>
  db
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
      setWhere: ownedEntryConflictGuard(userId, sessionId),
    });

const buildClimbEntryUpserts = (
  db: SyncSessionWriter,
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
): SyncBatchItem[] => {
  const operations: SyncBatchItem[] = [
    db
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
        notes: entry.notes,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: sessionEntries.id,
        set: {
          sequenceOrder: entry.sequenceOrder,
          durationMs: entry.durationMs,
          name: entry.name,
          grade: entry.grade,
          notes: entry.notes,
          updatedAt: now,
        },
        setWhere: ownedEntryConflictGuard(userId, sessionId),
      }),
  ];

  for (const image of entry.images) {
    operations.push(
      db
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
          setWhere: ownedImageConflictGuard(userId, sessionId),
        }),
    );
  }

  for (const attempt of entry.climbAttempts) {
    operations.push(
      db
        .insert(climbAttempts)
        .values({
          entryId: entry.id,
          sequenceOrder: attempt.sequenceOrder,
          durationMs: attempt.durationMs,
          completed: attempt.completed ?? null,
          notes: attempt.notes,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [climbAttempts.entryId, climbAttempts.sequenceOrder],
          set: {
            durationMs: attempt.durationMs,
            completed: attempt.completed ?? null,
            notes: attempt.notes,
            updatedAt: now,
          },
          setWhere: ownedAttemptConflictGuard(userId, sessionId),
        }),
    );
  }

  return operations;
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

  for (const entry of payload.entries) {
    if (entry.type === 'climb') {
      assertValidSyncedImagesForEntry({
        userId,
        sessionId: payload.id,
        entry,
      });
    }
  }

  const sessionLocation = payload.location ?? null;
  const startTime = new Date(payload.startTime);
  const endTime = new Date(payload.endTime);

  if (endTime < startTime) {
    throw new SyncSessionInvalidTimeRangeError();
  }

  const entryIds = collectEntryIds(payload);
  const imageIds = collectImageIds(payload);
  const now = new Date();

  await assertChildIdsOwnedBySession(db, {
    userId,
    sessionId: payload.id,
    entryIds,
    imageIds,
  });

  const batchOperations: SyncBatchItem[] = [
    db
      .insert(sessions)
      .values({
        id: payload.id,
        userId,
        gymId: payload.gymId,
        location: sessionLocation,
        startTime,
        endTime,
        totalDurationMs: payload.totalDurationMs,
        notes: payload.notes,
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
          notes: payload.notes,
          updatedAt: now,
        },
        setWhere: eq(sessions.userId, userId),
      }),
  ];

  for (const entry of payload.entries) {
    if (entry.type === 'climb') {
      batchOperations.push(
        ...buildClimbEntryUpserts(db, {
          userId,
          sessionId: payload.id,
          entry,
          now,
        }),
      );
      continue;
    }

    batchOperations.push(
      buildBreakEntryUpsert(db, {
        userId,
        sessionId: payload.id,
        entry,
        now,
      }),
    );
  }

  await db.batch(batchOperations as [SyncBatchItem, ...SyncBatchItem[]]);

  return { success: true, sessionId: payload.id };
};
