import { describe, expect, it } from 'vitest';
import {
  createIdleTimer,
  pauseTimer,
  startTimer,
  type TimerNow,
} from '../../src/lib/timer/index.js';
import type {
  BreakFormEntry,
  ClimbFormEntry,
} from '../../src/offline/db/types.js';
import {
  createBreakEntry,
  createClimbEntry,
} from '../../src/tracker/entry-factory.js';
import {
  applyBreakEnd,
  applyBreakRemove,
  applyBreakStart,
  pauseAllRunningClimbs,
} from '../../src/tracker/timer-orchestration.js';

const fixedNow =
  (epochMs: number): TimerNow =>
  () =>
    Temporal.Instant.fromEpochMilliseconds(epochMs);

/** A climb whose first attempt is running. */
const climbWithRunningAttempt = (): ClimbFormEntry => {
  const climb = createClimbEntry(0, 'Climb 1');
  return {
    ...climb,
    climbAttempts: [
      {
        ...climb.climbAttempts[0],
        timer: startTimer(createIdleTimer(), fixedNow(0)),
      },
    ],
  };
};

/** A climb whose first attempt is paused. */
const climbWithPausedAttempt = (): ClimbFormEntry => {
  const climb = createClimbEntry(0, 'Climb 1');
  return {
    ...climb,
    climbAttempts: [
      {
        ...climb.climbAttempts[0],
        timer: pauseTimer(
          startTimer(createIdleTimer(), fixedNow(0)),
          fixedNow(1000),
        ),
      },
    ],
  };
};

describe('timer orchestration', () => {
  it('pauses running attempt timers when a break starts', () => {
    const entries = [climbWithRunningAttempt(), createBreakEntry(1)];
    const next = applyBreakStart(entries, 1);

    expect(next[0]?.type).toBe('climb');
    const climb = next[0] as ClimbFormEntry;
    expect(climb.climbAttempts[0]?.timer.status).toBe('paused');

    expect(next[1]?.type).toBe('break');
    expect((next[1] as BreakFormEntry | undefined)?.timer.status).toBe(
      'running',
    );
  });

  it('ends a break and resumes paused attempt timers on the previous climb', () => {
    const entries = [
      climbWithPausedAttempt(),
      {
        ...createBreakEntry(1),
        timer: startTimer(createIdleTimer(), fixedNow(1000)),
      },
    ];

    const next = applyBreakEnd(entries, 1);

    expect(next[1]?.type).toBe('break');
    expect((next[1] as BreakFormEntry | undefined)?.timer.status).toBe(
      'stopped',
    );

    expect(next[0]?.type).toBe('climb');
    const climb = next[0] as ClimbFormEntry;
    expect(climb.climbAttempts[0]?.timer.status).toBe('running');
  });

  it('removes an active break and resumes paused attempt timers on the previous climb', () => {
    const entries = [
      climbWithPausedAttempt(),
      {
        ...createBreakEntry(1),
        timer: startTimer(createIdleTimer(), fixedNow(1000)),
      },
    ];

    const next = applyBreakRemove(entries, 1);

    expect(next).toHaveLength(1);
    expect(next[0]?.type).toBe('climb');
    const climb = next[0] as ClimbFormEntry;
    expect(climb.climbAttempts[0]?.timer.status).toBe('running');
  });

  it('pauseAllRunningClimbs leaves breaks unchanged', () => {
    const entries = [climbWithRunningAttempt(), createBreakEntry(1)];
    const next = pauseAllRunningClimbs(entries);

    expect(next[1]).toEqual(entries[1]);
    expect(next[0]?.type).toBe('climb');
    const climb = next[0] as ClimbFormEntry;
    expect(climb.climbAttempts[0]?.timer.status).toBe('paused');
  });

  it('does not resume attempts on previous climb if none were paused', () => {
    const climb = createClimbEntry(0, 'Climb 1');
    const entries = [
      climb,
      {
        ...createBreakEntry(1),
        timer: startTimer(createIdleTimer(), fixedNow(0)),
      },
    ];

    const next = applyBreakEnd(entries, 1);

    expect(next[0]).toEqual(climb);
  });
});
