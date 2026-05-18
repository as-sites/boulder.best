import {
  pauseTimer,
  resumeTimer,
  startTimer,
  stopTimer,
} from '../lib/timer/index.js';
import type { ClimbFormEntry, SessionFormEntry } from '../offline/db/types.js';

const pauseClimbTimers = (climb: ClimbFormEntry): ClimbFormEntry => {
  let next = climb;

  if (climb.timer.status === 'running') {
    next = { ...next, timer: pauseTimer(climb.timer) };
  }

  return {
    ...next,
    climbAttempts: climb.climbAttempts.map((attempt) =>
      attempt.timer.status === 'running'
        ? { ...attempt, timer: pauseTimer(attempt.timer) }
        : attempt,
    ),
  };
};

export const pauseAllRunningClimbs = (
  entries: SessionFormEntry[],
): SessionFormEntry[] =>
  entries.map((entry) =>
    entry.type === 'climb' ? pauseClimbTimers(entry) : entry,
  );

export const findPreviousClimbIndex = (
  entries: SessionFormEntry[],
  beforeIndex: number,
): number | null => {
  for (let index = beforeIndex - 1; index >= 0; index -= 1) {
    if (entries[index]?.type === 'climb') {
      return index;
    }
  }

  return null;
};

export const applyBreakStart = (
  entries: SessionFormEntry[],
  breakIndex: number,
): SessionFormEntry[] => {
  const pausedEntries = pauseAllRunningClimbs(entries);
  const breakEntry = pausedEntries[breakIndex];

  if (breakEntry?.type !== 'break') {
    return pausedEntries;
  }

  const startedBreak: SessionFormEntry = {
    ...breakEntry,
    timer:
      breakEntry.timer.status === 'idle'
        ? startTimer(breakEntry.timer)
        : breakEntry.timer,
  };

  return pausedEntries.map((entry, index) =>
    index === breakIndex ? startedBreak : entry,
  );
};

export const applyBreakEnd = (
  entries: SessionFormEntry[],
  breakIndex: number,
): SessionFormEntry[] => {
  const breakEntry = entries[breakIndex];

  if (breakEntry?.type !== 'break') {
    return entries;
  }

  let nextEntries = entries.map((entry, index) =>
    index === breakIndex
      ? { ...breakEntry, timer: stopTimer(breakEntry.timer) }
      : entry,
  );

  const previousClimbIndex = findPreviousClimbIndex(nextEntries, breakIndex);

  if (previousClimbIndex === null) {
    return nextEntries;
  }

  const previousClimb = nextEntries[previousClimbIndex];

  if (
    previousClimb?.type !== 'climb' ||
    previousClimb.timer.status !== 'paused'
  ) {
    return nextEntries;
  }

  nextEntries = nextEntries.map((entry, index) =>
    index === previousClimbIndex
      ? { ...previousClimb, timer: resumeTimer(previousClimb.timer) }
      : entry,
  );

  return nextEntries;
};

export const finalizeEntryTimers = (
  entries: SessionFormEntry[],
): SessionFormEntry[] =>
  entries.map((entry) => {
    if (entry.type === 'break') {
      return entry.timer.status === 'stopped'
        ? entry
        : { ...entry, timer: stopTimer(entry.timer) };
    }

    return {
      ...entry,
      timer:
        entry.timer.status === 'stopped' ? entry.timer : stopTimer(entry.timer),
      climbAttempts: entry.climbAttempts.map((attempt) => ({
        ...attempt,
        timer:
          attempt.timer.status === 'stopped'
            ? attempt.timer
            : stopTimer(attempt.timer),
      })),
    };
  });
