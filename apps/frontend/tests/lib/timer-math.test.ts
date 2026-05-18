import { describe, expect, it } from 'vitest';
import {
  createIdleTimer,
  elapsedDurationMs,
  pauseTimer,
  resumeTimer,
  startTimer,
  stopTimer,
  type TimerNow,
} from '../../src/lib/timer/index.js';

const fixedNow =
  (epochMs: number): TimerNow =>
  () =>
    Temporal.Instant.fromEpochMilliseconds(epochMs);

describe('timer math', () => {
  it('starts idle at zero elapsed', () => {
    const timer = createIdleTimer();
    expect(elapsedDurationMs(timer, fixedNow(1000))).toBe(0);
  });

  it('accumulates elapsed time while running', () => {
    const started = startTimer(createIdleTimer(), fixedNow(1000));
    expect(elapsedDurationMs(started, fixedNow(4500))).toBe(3500);
  });

  it('catches up after a sleep gap without pausing', () => {
    const started = startTimer(createIdleTimer(), fixedNow(0));
    expect(elapsedDurationMs(started, fixedNow(60_000))).toBe(60_000);
  });

  it('pauses and freezes elapsed until resume', () => {
    const started = startTimer(createIdleTimer(), fixedNow(1000));
    const paused = pauseTimer(started, fixedNow(3000));

    expect(elapsedDurationMs(paused, fixedNow(10_000))).toBe(2000);

    const resumed = resumeTimer(paused, fixedNow(10_000));
    expect(elapsedDurationMs(resumed, fixedNow(12_000))).toBe(4000);
  });

  it('stops and preserves final duration', () => {
    const started = startTimer(createIdleTimer(), fixedNow(0));
    const paused = pauseTimer(started, fixedNow(5000));
    const resumed = resumeTimer(paused, fixedNow(5000));
    const stopped = stopTimer(resumed, fixedNow(8000));

    expect(stopped.status).toBe('stopped');
    expect(stopped.activeStartTime).toBeNull();
    expect(elapsedDurationMs(stopped, fixedNow(99_000))).toBe(8000);
  });

  it('does not double-count when pause is called while already paused', () => {
    const started = startTimer(createIdleTimer(), fixedNow(1000));
    const paused = pauseTimer(started, fixedNow(2000));
    const pausedAgain = pauseTimer(paused, fixedNow(9000));

    expect(elapsedDurationMs(pausedAgain, fixedNow(9000))).toBe(1000);
  });

  it('throws when starting a stopped timer', () => {
    const stopped = stopTimer(createIdleTimer(), fixedNow(0));
    expect(() => startTimer(stopped, fixedNow(1))).toThrow(
      'Cannot start a stopped timer',
    );
  });
});
