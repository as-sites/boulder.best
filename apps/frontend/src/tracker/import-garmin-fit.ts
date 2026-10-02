import {
  Decoder,
  Stream,
  type FitMessages,
  type LapMesg,
  type SessionMesg,
  type SplitMesg,
} from '@garmin/fitsdk';
import type {
  BreakFormEntry,
  ClimbFormEntry,
  SessionFormEntry,
  SessionFormValues,
} from '../offline/db/types.js';
import {
  createBreakEntry,
  createClimbEntry,
  defaultClimbName,
  resequenceEntries,
} from './entry-factory.js';

const ACTIVE_SPLIT_TYPES = new Set<NonNullable<SplitMesg['splitType']>>([
  'climbActive',
  'intervalActive',
]);
const REST_SPLIT_TYPES = new Set<NonNullable<SplitMesg['splitType']>>([
  'climbRest',
  'intervalCooldown',
  'intervalRecovery',
  'intervalRest',
]);

export class GarminFitImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GarminFitImportError';
  }
}

const durationSecondsToMs = (value?: number): number | null =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.round(value * 1000)
    : null;

const asDate = (value: unknown): Date | null =>
  value instanceof Date && !Number.isNaN(value.getTime()) ? value : null;

const deriveEndTime = (
  startTime: Date | null,
  durationMs: number | null,
  explicitEndTime: Date | null,
): Date | null => {
  if (explicitEndTime) {
    return explicitEndTime;
  }

  if (startTime && durationMs !== null) {
    return new Date(startTime.getTime() + durationMs);
  }

  return null;
};

const lapDurationMs = (lap: LapMesg): number | null =>
  durationSecondsToMs(lap.totalTimerTime) ??
  durationSecondsToMs(lap.totalElapsedTime) ??
  (() => {
    const startTime = asDate(lap.startTime);
    const endTime = asDate(lap.timestamp);
    return startTime && endTime
      ? Math.max(0, endTime.getTime() - startTime.getTime())
      : null;
  })();

const splitDurationMs = (split: SplitMesg): number | null =>
  durationSecondsToMs(split.totalTimerTime) ??
  durationSecondsToMs(split.activeTime) ??
  durationSecondsToMs(split.totalElapsedTime) ??
  (() => {
    const startTime = asDate(split.startTime);
    const endTime = asDate(split.endTime);
    return startTime && endTime
      ? Math.max(0, endTime.getTime() - startTime.getTime())
      : null;
  })();

const buildImportedClimb = (
  sequenceOrder: number,
  climbIndex: number,
  durationMs: number,
): ClimbFormEntry => {
  const climb = createClimbEntry(sequenceOrder, defaultClimbName(climbIndex));
  return {
    ...climb,
    durationMs,
    climbAttempts: climb.climbAttempts.map((attempt) => ({
      ...attempt,
      durationMs,
      completed: true,
    })),
  };
};

const buildImportedBreak = (
  sequenceOrder: number,
  durationMs: number,
): BreakFormEntry => ({
  ...createBreakEntry(sequenceOrder),
  durationMs,
});

const sortByStartTime = <T extends { startTime?: unknown }>(values: T[]): T[] =>
  [...values].sort((left, right) => {
    const leftStart = asDate(left.startTime)?.getTime() ?? 0;
    const rightStart = asDate(right.startTime)?.getTime() ?? 0;
    return leftStart - rightStart;
  });

const entriesFromSplits = (splits: SplitMesg[]): SessionFormEntry[] => {
  const entries: SessionFormEntry[] = [];
  let climbIndex = 0;

  for (const split of sortByStartTime(splits)) {
    const durationMs = splitDurationMs(split);
    if (durationMs === null || durationMs <= 0) {
      continue;
    }

    if (split.splitType && ACTIVE_SPLIT_TYPES.has(split.splitType)) {
      entries.push(buildImportedClimb(entries.length, climbIndex, durationMs));
      climbIndex += 1;
      continue;
    }

    if (split.splitType && REST_SPLIT_TYPES.has(split.splitType)) {
      entries.push(buildImportedBreak(entries.length, durationMs));
    }
  }

  return entries;
};

const entriesFromLaps = (laps: LapMesg[]): SessionFormEntry[] => {
  const entries: SessionFormEntry[] = [];
  const sortedLaps = sortByStartTime(laps);

  sortedLaps.forEach((lap, climbIndex) => {
    const durationMs = lapDurationMs(lap);
    if (durationMs === null || durationMs <= 0) {
      return;
    }

    if (entries.length > 0) {
      const previousLap = sortedLaps[climbIndex - 1];
      const previousEnd = deriveEndTime(
        asDate(previousLap?.startTime) ?? null,
        previousLap ? lapDurationMs(previousLap) : null,
        asDate(previousLap?.timestamp) ?? null,
      );
      const currentStart = asDate(lap.startTime);
      const breakDurationMs =
        previousEnd && currentStart
          ? Math.max(0, currentStart.getTime() - previousEnd.getTime())
          : 0;

      if (breakDurationMs > 0) {
        entries.push(buildImportedBreak(entries.length, breakDurationMs));
      }
    }

    entries.push(buildImportedClimb(entries.length, climbIndex, durationMs));
  });

  return entries;
};

const extractEntries = (messages: FitMessages): SessionFormEntry[] => {
  const splitEntries = entriesFromSplits(messages.splitMesgs ?? []);
  if (splitEntries.length > 0) {
    return splitEntries;
  }

  const lapEntries = entriesFromLaps(messages.lapMesgs ?? []);
  if (lapEntries.length > 0) {
    return lapEntries;
  }

  return [];
};

const parseFitMessages = async (file: File): Promise<FitMessages> => {
  const arrayBuffer = await file.arrayBuffer();
  const stream = Stream.fromArrayBuffer(arrayBuffer);

  if (!Decoder.isFIT(stream)) {
    throw new GarminFitImportError('Select a valid Garmin .fit file');
  }

  const decoder = new Decoder(Stream.fromArrayBuffer(arrayBuffer));

  if (!decoder.checkIntegrity()) {
    throw new GarminFitImportError(
      'The selected Garmin .fit file is corrupted or incomplete',
    );
  }

  const { messages } = decoder.read({
    convertDateTimesToDates: true,
    convertTypesToStrings: true,
  });

  return messages;
};

const resolveSessionTiming = (
  session: SessionMesg,
  entries: SessionFormEntry[],
): Pick<SessionFormValues, 'startTime' | 'endTime' | 'totalDurationMs'> => {
  const sessionStartTime = asDate(session.startTime);
  const sessionDurationMs =
    durationSecondsToMs(session.totalElapsedTime) ??
    durationSecondsToMs(session.totalTimerTime);
  const sessionEndTime = deriveEndTime(
    sessionStartTime,
    sessionDurationMs,
    asDate(session.timestamp),
  );

  const totalDurationMs =
    sessionDurationMs ??
    entries.reduce((total, entry) => total + entry.durationMs, 0);

  if (!sessionStartTime || !sessionEndTime || totalDurationMs <= 0) {
    throw new GarminFitImportError(
      'Unable to find a complete session timeline in the Garmin .fit file',
    );
  }

  return {
    startTime: sessionStartTime.toISOString(),
    endTime: sessionEndTime.toISOString(),
    totalDurationMs,
  };
};

export const importSessionFormFromGarminFit = async (
  file: File,
  form: SessionFormValues,
): Promise<SessionFormValues> => {
  const messages = await parseFitMessages(file);
  const session = messages.sessionMesgs?.[0];

  if (!session) {
    throw new GarminFitImportError(
      'Unable to find a session in the Garmin .fit file',
    );
  }

  const entries = extractEntries(messages);
  const timing = resolveSessionTiming(session, entries);
  const importedEntries =
    entries.length > 0
      ? entries
      : [buildImportedClimb(0, 0, timing.totalDurationMs)];

  return {
    ...form,
    ...timing,
    status: 'stopped',
    entries: resequenceEntries(importedEntries),
  };
};
