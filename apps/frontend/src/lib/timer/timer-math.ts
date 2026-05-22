import type { TimerNow, TimerState } from './types.js';

const defaultNow: TimerNow = () => Temporal.Now.instant();

const resolveNow = (now?: TimerNow): TimerNow => now ?? defaultNow;

const instantToIso = (instant: Temporal.Instant): string => instant.toString();

/** Temporal durations can include sub-millisecond precision; persist whole ms. */
const roundDurationMs = (durationMs: number): number => Math.round(durationMs);

const activeElapsedMs = (state: TimerState, now: TimerNow): number => {
  if (state.activeStartTime === null) {
    return 0;
  }

  const activeStart = Temporal.Instant.from(state.activeStartTime);
  const elapsed = now().since(activeStart);
  return roundDurationMs(elapsed.total({ unit: 'milliseconds' }));
};

/** Elapsed duration in milliseconds from stored timer state. */
export const elapsedDurationMs = (
  state: TimerState,
  now?: TimerNow,
): number => {
  const readNow = resolveNow(now);
  return roundDurationMs(
    state.accumulatedDurationMs + activeElapsedMs(state, readNow),
  );
};

export const createIdleTimer = (): TimerState => ({
  accumulatedDurationMs: 0,
  activeStartTime: null,
  status: 'idle',
});

export const startTimer = (state: TimerState, now?: TimerNow): TimerState => {
  if (state.status === 'running') {
    return state;
  }

  if (state.status === 'stopped') {
    throw new Error('Cannot start a stopped timer');
  }

  const readNow = resolveNow(now);
  return {
    ...state,
    activeStartTime: instantToIso(readNow()),
    status: 'running',
  };
};

export const pauseTimer = (state: TimerState, now?: TimerNow): TimerState => {
  if (state.status !== 'running') {
    return state;
  }

  const readNow = resolveNow(now);
  return {
    accumulatedDurationMs: elapsedDurationMs(state, readNow),
    activeStartTime: null,
    status: 'paused',
  };
};

export const resumeTimer = (state: TimerState, now?: TimerNow): TimerState =>
  startTimer(state, now);

export const stopTimer = (state: TimerState, now?: TimerNow): TimerState => {
  if (state.status === 'stopped') {
    return state;
  }

  if (state.status === 'idle') {
    return { ...state, status: 'stopped' };
  }

  const readNow = resolveNow(now);
  return {
    accumulatedDurationMs: elapsedDurationMs(state, readNow),
    activeStartTime: null,
    status: 'stopped',
  };
};
