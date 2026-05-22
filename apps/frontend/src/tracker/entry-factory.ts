import { createIdleTimer } from '../lib/timer/index.js';
import type {
  ClimbAttemptFormEntry,
  ClimbFormEntry,
  BreakFormEntry,
  SessionFormEntry,
} from '../offline/db/types.js';

export const countClimbsInEntries = (entries: SessionFormEntry[]): number =>
  entries.filter((entry) => entry.type === 'climb').length;

export const defaultClimbName = (climbIndex: number): string =>
  `Climb ${climbIndex + 1}`;

export const createClimbAttempt = (
  sequenceOrder: number,
): ClimbAttemptFormEntry => ({
  sequenceOrder,
  durationMs: 0,
  completed: false,
  notes: null,
  timer: createIdleTimer(),
});

export const createClimbEntry = (
  sequenceOrder: number,
  name: string,
): ClimbFormEntry => ({
  id: crypto.randomUUID(),
  sequenceOrder,
  type: 'climb',
  name,
  grade: null,
  notes: null,
  durationMs: 0,
  timer: createIdleTimer(),
  climbAttempts: [createClimbAttempt(0)],
});

export const createBreakEntry = (sequenceOrder: number): BreakFormEntry => ({
  id: crypto.randomUUID(),
  sequenceOrder,
  type: 'break',
  durationMs: 0,
  timer: createIdleTimer(),
});

export const resequenceEntries = (
  entries: SessionFormEntry[],
): SessionFormEntry[] =>
  entries.map((entry, sequenceOrder) => ({ ...entry, sequenceOrder }));
