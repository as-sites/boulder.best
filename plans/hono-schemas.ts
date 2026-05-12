import { z } from '@hono/zod-openapi';

// --- SHARED SCHEMAS ---

// Base properties shared by all timeline entries (Climbs and Breaks)
const BaseEntrySchema = z.object({
  id: z.string().uuid().openapi({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Client-generated UUID for the row entry',
  }),
  sequenceOrder: z.number().int().nonnegative().openapi({
    example: 0,
    description: 'Chronological order of this entry in the session',
  }),
  durationMs: z.number().int().nonnegative().openapi({
    example: 45_000,
    description: 'Total time spent on this block in milliseconds',
  }),
});

// --- POLYMORPHIC ENTRIES ---

export const ClimbEntrySchema = BaseEntrySchema.extend({
  type: z.literal('climb'),
  name: z.string().max(255).optional().nullable().openapi({
    example: 'Pink corner route',
  }),
  grade: z.string().max(50).optional().nullable().openapi({
    example: 'V3',
  }),
  attempts: z.number().int().positive().optional().nullable().openapi({
    example: 2,
  }),
  completed: z.boolean().optional().nullable().openapi({
    example: true,
  }),
  notes: z.string().optional().nullable(),
  // Note: The frontend Dexie schema uses `localImageId`, but the backend expects
  // the finalized `photoUrl` after the R2 upload step is complete.
  photoUrl: z.string().url().optional().nullable().openapi({
    example: 'https://cdn.yourdomain.com/images/123.jpg',
  }),
}).openapi('ClimbEntry');

export const BreakEntrySchema = BaseEntrySchema.extend({
  type: z.literal('break'),
}).openapi('BreakEntry');

// The Discriminated Union perfectly handles the polymorphic list
export const SessionEntrySchema = z
  .discriminatedUnion('type', [ClimbEntrySchema, BreakEntrySchema])
  .openapi('SessionEntry');

// --- MAIN SESSION PAYLOAD ---

export const SyncSessionPayloadSchema = z
  .object({
    id: z.string().uuid().openapi({
      example: '987fcdeb-51a2-43d7-9012-345678901234',
    }),
    gymId: z.string().uuid().openapi({
      example: 'a1b2c3d4-e5f6-7890-1234-56789abcdef0',
    }),
    // z.string().datetime() strictly validates ISO 8601 strings, which perfectly
    // matches what Temporal.Now.instant().toString() produces on the client.
    startTime: z.string().datetime().openapi({
      example: '2026-05-13T10:00:00Z',
    }),
    endTime: z.string().datetime().openapi({
      example: '2026-05-13T12:00:00Z',
    }),
    totalDurationMs: z.number().int().nonnegative().openapi({
      example: 7_200_000, // 2 hours
    }),
    notes: z.string().optional().nullable().openapi({
      example: 'Felt strong today, projecting the new set.',
    }),
    entries: z.array(SessionEntrySchema).openapi({
      description: 'Chronological list of climbs and breaks for this session',
    }),
  })
  .openapi('SyncSessionPayload');
