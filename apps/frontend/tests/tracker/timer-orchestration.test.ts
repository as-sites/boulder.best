import { describe, expect, it } from 'vitest';
import {
  createIdleTimer,
  pauseTimer,
  startTimer,
  type TimerNow,
} from '../../src/lib/timer/index.js';
import type { ClimbFormEntry } from '../../src/offline/db/types.js';
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

// const expectClimb = (entry: SessionFormEntry): ClimbFormEntry => {
//   expect(entry.type).toBe('climb');
//   return entry as ClimbFormEntry;
// };

const runningClimb = (): ClimbFormEntry => {
  const climb = createClimbEntry(0, 'Climb 1');
  return {
    ...climb,
    timer: startTimer(climb.timer, fixedNow(0)),
  };
};

describe('timer orchestration', () => {
  it('pauses running climb timers when a break starts', () => {
    const entries = [runningClimb(), createBreakEntry(1)];
    const next = applyBreakStart(entries, 1);

    expect(next[0]?.type).toBe('climb');
    expect(next[0]?.timer.status).toBe('paused');

    expect(next[1]?.type).toBe('break');
    expect(next[1]?.timer.status).toBe('running');
  });

  it('ends a break and resumes the previous paused climb', () => {
    const climb = runningClimb();
    const pausedClimb = {
      ...climb,
      timer: pauseTimer(climb.timer, fixedNow(1000)),
    };
    const entries = [
      pausedClimb,
      {
        ...createBreakEntry(1),
        timer: startTimer(createIdleTimer(), fixedNow(1000)),
      },
    ];

    const next = applyBreakEnd(entries, 1);

    expect(next[1]?.type).toBe('break');
    expect(next[1]?.timer.status).toBe('stopped');

    expect(next[0]?.type).toBe('climb');
    expect(next[0]?.timer.status).toBe('running');
  });

  it('removes an active break and resumes the previous paused climb', () => {
    const climb = runningClimb();
    const pausedClimb = {
      ...climb,
      timer: pauseTimer(climb.timer, fixedNow(1000)),
    };
    const entries = [
      pausedClimb,
      {
        ...createBreakEntry(1),
        timer: startTimer(createIdleTimer(), fixedNow(1000)),
      },
    ];

    const next = applyBreakRemove(entries, 1);

    expect(next).toHaveLength(1);
    expect(next[0]?.type).toBe('climb');
    expect(next[0]?.timer.status).toBe('running');
  });

  it('pauseAllRunningClimbs leaves breaks unchanged', () => {
    const entries = [runningClimb(), createBreakEntry(1)];
    const next = pauseAllRunningClimbs(entries);

    expect(next[1]).toEqual(entries[1]);
    expect(next[0]?.type).toBe('climb');
    expect(next[0]?.timer.status).toBe('paused');
  });
});
