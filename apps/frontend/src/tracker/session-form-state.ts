import type { TimerState } from '../lib/timer/types.js';
import type { SessionFormValues } from '../offline/db/types.js';
import { finalizeEntryTimers } from './timer-orchestration.js';

export const createEmptySessionForm = (): SessionFormValues => ({
  id: crypto.randomUUID(),
  gymId: null,
  location: null,
  startTime: null,
  endTime: null,
  totalDurationMs: 0,
  notes: null,
  status: 'not_started',
  entries: [],
});

/** Merge persisted draft data with defaults for fields added after save. */
export const hydrateSessionForm = (
  formData: Partial<SessionFormValues> & Pick<SessionFormValues, 'id'>,
): SessionFormValues => ({
  ...createEmptySessionForm(),
  ...formData,
  location: formData.location ?? null,
});

/** Running session timer derived from `startTime` for display only. */
export const sessionDisplayTimer = (
  form: Pick<SessionFormValues, 'startTime' | 'status' | 'totalDurationMs'>,
): TimerState => {
  if (form.status === 'active' && form.startTime !== null) {
    return {
      accumulatedDurationMs: 0,
      activeStartTime: form.startTime,
      status: 'running',
    };
  }

  if (form.status === 'stopped') {
    return {
      accumulatedDurationMs: form.totalDurationMs,
      activeStartTime: null,
      status: 'stopped',
    };
  }

  return {
    accumulatedDurationMs: 0,
    activeStartTime: null,
    status: 'idle',
  };
};

export interface StartSessionOptions {
  gymLocations?: ReadonlyArray<string>;
}

export const startSession = (
  form: SessionFormValues,
  now: () => Temporal.Instant = Temporal.Now.instant,
  options: StartSessionOptions = {},
): SessionFormValues => {
  if (form.gymId === null) {
    throw new Error('Select a gym before starting the session');
  }

  const gymLocations = options.gymLocations ?? [];
  if (gymLocations.length > 0 && form.location === null) {
    throw new Error('Select a location before starting the session');
  }

  if (form.status === 'active') {
    return form;
  }

  return {
    ...form,
    startTime: now().toString(),
    endTime: null,
    totalDurationMs: 0,
    status: 'active',
  };
};

export const stopSession = (
  form: SessionFormValues,
  now: () => Temporal.Instant = Temporal.Now.instant,
): SessionFormValues => {
  if (form.status !== 'active' || form.startTime === null) {
    throw new Error('Only an active session can be stopped');
  }

  const endInstant = now();
  const startInstant = Temporal.Instant.from(form.startTime);
  const totalDurationMs = endInstant
    .since(startInstant)
    .total({ unit: 'milliseconds' });

  return {
    ...form,
    endTime: endInstant.toString(),
    totalDurationMs,
    status: 'stopped',
    entries: finalizeEntryTimers(form.entries),
  };
};
