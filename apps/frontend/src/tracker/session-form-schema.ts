import { z } from 'zod';

export const timerStateSchema = z.union([
  z.object({
    status: z.enum(['idle', 'paused', 'stopped']),
    accumulatedDurationMs: z.number().int().nonnegative(),
    activeStartTime: z.null(),
  }),
  z.object({
    status: z.literal('running'),
    accumulatedDurationMs: z.number().int().nonnegative(),
    activeStartTime: z.string(),
  }),
]);

export const climbAttemptFormEntrySchema = z.object({
  sequenceOrder: z.number().int().nonnegative(),
  durationMs: z.number().int().nonnegative(),
  completed: z.boolean().nullable().optional(),
  notes: z.string(),
  timer: timerStateSchema,
});

export const climbFormEntrySchema = z.object({
  id: z.uuid(),
  sequenceOrder: z.number().int().nonnegative(),
  type: z.literal('climb'),
  name: z.string().max(255),
  grade: z.string().max(50),
  notes: z.string(),
  durationMs: z.number().int().nonnegative(),
  timer: timerStateSchema,
  climbAttempts: z.array(climbAttemptFormEntrySchema),
});

export const breakFormEntrySchema = z.object({
  id: z.uuid(),
  sequenceOrder: z.number().int().nonnegative(),
  type: z.literal('break'),
  durationMs: z.number().int().nonnegative(),
  timer: timerStateSchema,
});

export const sessionFormEntrySchema = z.discriminatedUnion('type', [
  climbFormEntrySchema,
  breakFormEntrySchema,
]);

export const sessionFormSchema = z.object({
  id: z.uuid(),
  gymId: z.uuid().nullable(),
  location: z.string().nullable(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  totalDurationMs: z.number().int().nonnegative(),
  notes: z.string(),
  status: z.enum(['not_started', 'active', 'stopped']),
  entries: z.array(sessionFormEntrySchema),
  deletedEntryIds: z.array(z.uuid()),
});

export type SessionFormSchema = z.infer<typeof sessionFormSchema>;
