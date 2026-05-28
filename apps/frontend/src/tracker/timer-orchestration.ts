import {
  pauseTimer,
  resumeTimer,
  startTimer,
  stopTimer,
} from '../lib/timer/index.js';
import type { ClimbFormEntry, SessionFormEntry } from '../offline/db/types.js';

const pauseClimbTimers = (climb: ClimbFormEntry): ClimbFormEntry => ({
  ...climb,
  climbAttempts: climb.climbAttempts.map((attempt) =>
    attempt.timer.status === 'running'
      ? { ...attempt, timer: pauseTimer(attempt.timer) }
      : attempt,
  ),
});

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

  const nextEntries = entries.map((entry, index) =>
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
    !previousClimb.climbAttempts.some((a) => a.timer.status === 'paused')
  ) {
    return nextEntries;
  }

  return nextEntries.map((entry, index) =>
    index === previousClimbIndex
      ? {
          ...previousClimb,
          climbAttempts: previousClimb.climbAttempts.map((attempt) =>
            attempt.timer.status === 'paused'
              ? { ...attempt, timer: resumeTimer(attempt.timer) }
              : attempt,
          ),
        }
      : entry,
  );
};

export const applyBreakRemove = (
  entries: SessionFormEntry[],
  breakIndex: number,
): SessionFormEntry[] => {
  const breakEntry = entries[breakIndex];

  if (breakEntry?.type !== 'break') {
    return entries;
  }

  const isActiveBreak =
    breakEntry.timer.status === 'running' ||
    breakEntry.timer.status === 'paused';
  const withoutBreak = entries.filter((_, index) => index !== breakIndex);

  if (!isActiveBreak) {
    return withoutBreak;
  }

  const previousClimbIndex = findPreviousClimbIndex(entries, breakIndex);

  if (previousClimbIndex === null) {
    return withoutBreak;
  }

  const previousClimb = withoutBreak[previousClimbIndex];

  if (
    previousClimb?.type !== 'climb' ||
    !previousClimb.climbAttempts.some((a) => a.timer.status === 'paused')
  ) {
    return withoutBreak;
  }

  return withoutBreak.map((entry, index) =>
    index === previousClimbIndex
      ? {
          ...previousClimb,
          climbAttempts: previousClimb.climbAttempts.map((attempt) =>
            attempt.timer.status === 'paused'
              ? { ...attempt, timer: resumeTimer(attempt.timer) }
              : attempt,
          ),
        }
      : entry,
  );
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
      climbAttempts: entry.climbAttempts.map((attempt) => ({
        ...attempt,
        timer:
          attempt.timer.status === 'stopped'
            ? attempt.timer
            : stopTimer(attempt.timer),
      })),
    };
  });
