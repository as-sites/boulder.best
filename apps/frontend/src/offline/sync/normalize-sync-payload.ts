import type { SyncSessionPayload } from '@boulder/api-contract';

const roundMs = (durationMs: number): number => Math.round(durationMs);

/**
 * Temporal instants can include nanoseconds; the API expects ms-precision ISO
 * strings.
 */
const toApiIsoDateTime = (value: string): string =>
  new Date(value).toISOString();

/**
 * Coerce fractional Temporal durations to whole milliseconds for API
 * validation.
 */
export const normalizeSyncSessionPayload = (
  payload: SyncSessionPayload,
): SyncSessionPayload => ({
  ...payload,
  deletedEntryIds: payload.deletedEntryIds ?? [],
  startTime: toApiIsoDateTime(payload.startTime),
  endTime: toApiIsoDateTime(payload.endTime),
  totalDurationMs: roundMs(payload.totalDurationMs),
  entries: payload.entries.map((entry) => {
    if (entry.type === 'break') {
      return {
        ...entry,
        durationMs: roundMs(entry.durationMs),
      };
    }

    return {
      ...entry,
      durationMs: roundMs(entry.durationMs),
      climbAttempts: entry.climbAttempts.map((attempt) => ({
        ...attempt,
        durationMs: roundMs(attempt.durationMs),
      })),
    };
  }),
});
