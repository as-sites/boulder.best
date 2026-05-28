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

export const createClimbAttempt = (sequenceOrder: number) =>
  ({
    sequenceOrder,
    durationMs: 0,
    completed: false,
    notes: '',
    timer: createIdleTimer(),
  }) as const satisfies ClimbAttemptFormEntry;

export const createClimbEntry = (sequenceOrder: number, name: string) =>
  ({
    id: crypto.randomUUID(),
    sequenceOrder,
    type: 'climb',
    name,
    grade: '',
    notes: '',
    durationMs: 0,
    climbAttempts: [createClimbAttempt(0)],
  }) as const satisfies ClimbFormEntry;

export const createBreakEntry = (sequenceOrder: number) =>
  ({
    id: crypto.randomUUID(),
    sequenceOrder,
    type: 'break',
    durationMs: 0,
    timer: createIdleTimer(),
  }) as const satisfies BreakFormEntry;

export const resequenceEntries = (
  entries: SessionFormEntry[],
): SessionFormEntry[] =>
  entries.map((entry, sequenceOrder) => ({ ...entry, sequenceOrder }));
