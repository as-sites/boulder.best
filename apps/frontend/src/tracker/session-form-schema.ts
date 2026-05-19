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
  notes: z.string().nullable().optional(),
  timer: timerStateSchema,
});

export const climbFormEntrySchema = z.object({
  id: z.uuid(),
  sequenceOrder: z.number().int().nonnegative(),
  type: z.literal('climb'),
  name: z.string().max(255).nullable(),
  grade: z.string().max(50).nullable(),
  completed: z.boolean().nullable(),
  notes: z.string().nullable().optional(),
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
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  totalDurationMs: z.number().int().nonnegative(),
  notes: z.string().nullable().optional(),
  status: z.enum(['not_started', 'active', 'stopped']),
  entries: z.array(sessionFormEntrySchema),
});

export type SessionFormSchema = z.infer<typeof sessionFormSchema>;
