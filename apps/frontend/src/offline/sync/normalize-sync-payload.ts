import type { SyncSessionPayload } from '@boulder/api-contract';

const roundMs = (durationMs: number): number => Math.round(durationMs);

/**
 * Coerce fractional Temporal durations to whole milliseconds for API
 * validation.
 */
export const normalizeSyncSessionPayload = (
  payload: SyncSessionPayload,
): SyncSessionPayload => ({
  ...payload,
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
