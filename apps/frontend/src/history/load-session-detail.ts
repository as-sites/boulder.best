import type {
  SessionDetailResponse,
  SyncSessionPayload,
} from '@boulder/api-contract';
import { apiClient } from '../lib/api-client.js';
import { syncQueueRepository } from '../offline/repositories/sync-queue-repository.js';

export type SessionDetailSource = 'server' | 'local';

export interface LoadedSessionDetail {
  source: SessionDetailSource;
  session: SessionDetailResponse;
}

const toLocalSessionDetail = (
  payload: SyncSessionPayload,
  gymName: string,
): SessionDetailResponse => ({
  id: payload.id,
  gymId: payload.gymId,
  gymName,
  startTime: payload.startTime,
  endTime: payload.endTime,
  totalDurationMs: payload.totalDurationMs,
  notes: payload.notes,
  entries: payload.entries.map((entry) => {
    if (entry.type === 'break') {
      return entry;
    }

    return {
      id: entry.id,
      sequenceOrder: entry.sequenceOrder,
      durationMs: entry.durationMs,
      type: 'climb' as const,
      name: entry.name,
      grade: entry.grade,
      attempts: entry.climbAttempts.length,
      completed: entry.completed,
      notes: entry.notes,
      images: entry.images,
    };
  }),
});

export const loadSessionDetail = async (
  sessionId: string,
  gymNamesById: Readonly<Record<string, string>> = {},
): Promise<LoadedSessionDetail | null> => {
  let response: Awaited<
    ReturnType<(typeof apiClient.api.sessions)[':id']['$get']>
  > | null = null;

  try {
    response = await apiClient.api.sessions[':id'].$get({
      param: { id: sessionId },
    });
  } catch {
    // Network error (e.g. device is offline) – fall through to local queue.
  }

  if (response !== null) {
    if (response.ok) {
      return {
        source: 'server',
        session: await response.json(),
      };
    }

    if (response.status !== 404) {
      throw new Error(`Failed to load session detail (${response.status})`);
    }
  }

  const queueItem = await syncQueueRepository.get(sessionId);
  if (!queueItem) {
    return null;
  }

  return {
    source: 'local',
    session: toLocalSessionDetail(
      queueItem.payload,
      gymNamesById[queueItem.payload.gymId] ?? 'Unknown gym',
    ),
  };
};
