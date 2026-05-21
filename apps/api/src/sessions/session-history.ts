import {
  imageContentTypeSchema,
  type SessionDetailResponse,
  type SessionHistoryListQuery,
  type SessionHistoryListResponse,
} from '@boulder/api-contract';
import { and, asc, count, desc, eq, lt } from 'drizzle-orm';
import type { AppDb } from '../db/index.js';
import {
  climbAttempts,
  gyms,
  sessionEntries,
  sessionEntryImages,
  sessions,
} from '../db/schema.js';

export const listSessions = async (
  db: AppDb,
  userId: string,
  query: SessionHistoryListQuery,
): Promise<SessionHistoryListResponse> => {
  const conditions = [eq(sessions.userId, userId)];

  if (query.cursor) {
    conditions.push(lt(sessions.startTime, new Date(query.cursor)));
  }

  const rows = await db
    .select({
      id: sessions.id,
      gymId: sessions.gymId,
      gymName: gyms.name,
      location: sessions.location,
      startTime: sessions.startTime,
      endTime: sessions.endTime,
      totalDurationMs: sessions.totalDurationMs,
      entryCount: count(sessionEntries.id),
    })
    .from(sessions)
    .innerJoin(gyms, eq(sessions.gymId, gyms.id))
    .leftJoin(sessionEntries, eq(sessionEntries.sessionId, sessions.id))
    .where(and(...conditions))
    .groupBy(
      sessions.id,
      sessions.gymId,
      gyms.name,
      sessions.location,
      sessions.startTime,
      sessions.endTime,
      sessions.totalDurationMs,
    )
    .orderBy(desc(sessions.startTime))
    .limit(query.limit + 1);

  const hasMore = rows.length > query.limit;
  const pageRows = hasMore ? rows.slice(0, query.limit) : rows;
  const lastRow = pageRows.at(-1);

  return {
    items: pageRows.map((row) => ({
      id: row.id,
      gymId: row.gymId,
      gymName: row.gymName,
      location: row.location ?? undefined,
      startTime: row.startTime.toISOString(),
      endTime: row.endTime.toISOString(),
      totalDurationMs: row.totalDurationMs,
      entryCount: row.entryCount,
    })),
    nextCursor: hasMore && lastRow ? lastRow.startTime.toISOString() : null,
  };
};

export const getSessionDetail = async (
  db: AppDb,
  userId: string,
  sessionId: string,
): Promise<SessionDetailResponse | null> => {
  const [session] = await db
    .select({
      id: sessions.id,
      gymId: sessions.gymId,
      gymName: gyms.name,
      location: sessions.location,
      startTime: sessions.startTime,
      endTime: sessions.endTime,
      totalDurationMs: sessions.totalDurationMs,
      notes: sessions.notes,
    })
    .from(sessions)
    .innerJoin(gyms, eq(sessions.gymId, gyms.id))
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)))
    .limit(1);

  if (!session) {
    return null;
  }

  const entries = await db
    .select({
      id: sessionEntries.id,
      sequenceOrder: sessionEntries.sequenceOrder,
      durationMs: sessionEntries.durationMs,
      type: sessionEntries.type,
      name: sessionEntries.name,
      grade: sessionEntries.grade,
      completed: sessionEntries.completed,
      notes: sessionEntries.notes,
    })
    .from(sessionEntries)
    .where(
      and(
        eq(sessionEntries.sessionId, sessionId),
        eq(sessionEntries.userId, userId),
      ),
    )
    .orderBy(asc(sessionEntries.sequenceOrder));

  const images = await db
    .select({
      id: sessionEntryImages.id,
      entryId: sessionEntryImages.entryId,
      index: sessionEntryImages.imageIndex,
      objectKey: sessionEntryImages.objectKey,
      photoUrl: sessionEntryImages.photoUrl,
      contentType: sessionEntryImages.contentType,
      contentLength: sessionEntryImages.contentLength,
    })
    .from(sessionEntryImages)
    .where(
      and(
        eq(sessionEntryImages.sessionId, sessionId),
        eq(sessionEntryImages.userId, userId),
      ),
    )
    .orderBy(
      asc(sessionEntryImages.entryId),
      asc(sessionEntryImages.imageIndex),
    );

  const attemptCounts = await db
    .select({
      entryId: climbAttempts.entryId,
      attempts: count(),
    })
    .from(climbAttempts)
    .innerJoin(sessionEntries, eq(climbAttempts.entryId, sessionEntries.id))
    .where(eq(sessionEntries.sessionId, sessionId))
    .groupBy(climbAttempts.entryId);

  const imagesByEntryId = new Map<string, typeof images>();
  for (const image of images) {
    const entryImages = imagesByEntryId.get(image.entryId) ?? [];
    entryImages.push(image);
    imagesByEntryId.set(image.entryId, entryImages);
  }

  const attemptsByEntryId = new Map(
    attemptCounts.map((row) => [row.entryId, row.attempts]),
  );

  return {
    id: session.id,
    gymId: session.gymId,
    gymName: session.gymName,
    location: session.location ?? undefined,
    startTime: session.startTime.toISOString(),
    endTime: session.endTime.toISOString(),
    totalDurationMs: session.totalDurationMs,
    notes: session.notes ?? undefined,
    entries: entries.map((entry) => {
      if (entry.type === 'break') {
        return {
          id: entry.id,
          sequenceOrder: entry.sequenceOrder,
          durationMs: entry.durationMs,
          type: 'break' as const,
        };
      }

      const attemptCount = attemptsByEntryId.get(entry.id) ?? 0;

      return {
        id: entry.id,
        sequenceOrder: entry.sequenceOrder,
        durationMs: entry.durationMs,
        type: 'climb' as const,
        name: entry.name,
        grade: entry.grade,
        attempts: attemptCount > 0 ? attemptCount : null,
        completed: entry.completed,
        notes: entry.notes ?? undefined,
        images: (imagesByEntryId.get(entry.id) ?? []).map((image) => ({
          id: image.id,
          index: image.index,
          objectKey: image.objectKey,
          photoUrl: image.photoUrl,
          contentType: imageContentTypeSchema.parse(image.contentType),
          contentLength: image.contentLength,
        })),
      };
    }),
  };
};
