import { z } from '@hono/zod-openapi';
import { MAX_IMAGE_UPLOAD_BYTES, MAX_IMAGE_UPLOAD_ERROR } from './constants.js';

// --- Health ---

export const healthResponseSchema = z.object({
  ok: z.boolean(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

// --- Shared primitives ---

export const imageContentTypeSchema = z
  .enum(['image/jpeg', 'image/png', 'image/webp'])
  .openapi({
    description: 'Allowed image MIME types for uploads and synced metadata',
  });

export type ImageContentType = z.infer<typeof imageContentTypeSchema>;

const isoDateTimeSchema = z.iso.datetime();

// --- Image metadata ---

export const syncedImageSchema = z
  .object({
    id: z.uuid().openapi({
      description: 'Client-generated image id',
      example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    index: z.number().int().nonnegative().openapi({
      description: 'Stable ordering index within the climb entry',
      example: 0,
    }),
    objectKey: z.string().min(1).openapi({
      example: 'user-id/session-id/entry-id/1715600000000-0.webp',
    }),
    photoUrl: z.url().openapi({
      example:
        'https://cdn.example.com/user-id/session-id/entry-id/1715600000000-0.webp',
    }),
    contentType: imageContentTypeSchema,
    contentLength: z.number().int().positive().openapi({
      example: 1_024_000,
    }),
  })
  .openapi('SyncedImage');

export type SyncedImage = z.infer<typeof syncedImageSchema>;

// --- Gyms ---

export const gymSchema = z
  .object({
    id: z.uuid(),
    name: z.string().min(1),
    grades: z.array(z.string()),
    locations: z.array(z.string()),
    updatedAt: isoDateTimeSchema,
  })
  .openapi('Gym');

export const gymsResponseSchema = z.array(gymSchema).openapi('GymsResponse');

export type Gym = z.infer<typeof gymSchema>;
export type GymsResponse = z.infer<typeof gymsResponseSchema>;

// --- Upload presign ---

export const presignedUploadRequestSchema = z
  .object({
    sessionId: z.uuid().openapi({
      description: 'Client session id used in the R2 object key path',
    }),
    entryId: z.uuid().openapi({
      description: 'Climb entry id used in the R2 object key path',
    }),
    imageId: z.uuid().openapi({
      description: 'Client-generated image id',
    }),
    index: z.number().int().nonnegative().openapi({
      description: 'Stable image index within the climb entry',
    }),
    contentType: imageContentTypeSchema,
    contentLength: z
      .number()
      .int()
      .positive()
      .max(MAX_IMAGE_UPLOAD_BYTES, MAX_IMAGE_UPLOAD_ERROR),
  })
  .openapi('PresignedUploadRequest');

export const presignedUploadResponseSchema = z
  .object({
    uploadUrl: z.url(),
    objectKey: z.string().min(1),
    photoUrl: z.url(),
    image: syncedImageSchema,
  })
  .openapi('PresignedUploadResponse');

export type PresignedUploadRequest = z.infer<
  typeof presignedUploadRequestSchema
>;
export type PresignedUploadResponse = z.infer<
  typeof presignedUploadResponseSchema
>;

// --- Sync session payload ---

const syncBaseEntrySchema = z.object({
  id: z.uuid().openapi({
    description: 'Client-generated UUID for the row entry',
    example: '123e4567-e89b-12d3-a456-426614174000',
  }),
  sequenceOrder: z.number().int().nonnegative().openapi({
    description: 'Chronological order of this entry in the session',
    example: 0,
  }),
  durationMs: z.number().int().nonnegative().openapi({
    description: 'Total time spent on this block in milliseconds',
    example: 45_000,
  }),
});

export const syncClimbAttemptSchema = z
  .object({
    sequenceOrder: z.number().int().nonnegative().openapi({
      description: 'Chronological order of this attempt within the climb entry',
      example: 0,
    }),
    durationMs: z.number().int().nonnegative().openapi({
      description: 'Time spent on this attempt in milliseconds',
      example: 12_000,
    }),
    completed: z.boolean().nullable().optional(),
    notes: z.string(),
  })
  .strict()
  .openapi('SyncClimbAttempt');

export const syncClimbEntrySchema = syncBaseEntrySchema
  .extend({
    type: z.literal('climb'),
    name: z.string().max(255),
    grade: z.string().max(50),
    notes: z.string(),
    climbAttempts: z.array(syncClimbAttemptSchema).openapi({
      description:
        'Per-attempt timings for this climb; ignored on break entries',
    }),
    images: z.array(syncedImageSchema).openapi({
      description:
        'Remote image metadata after R2 upload (multiple photos per climb)',
    }),
  })
  .strict()
  .openapi('SyncClimbEntry');

export const syncBreakEntrySchema = syncBaseEntrySchema
  .extend({
    type: z.literal('break'),
  })
  .strict()
  .openapi('SyncBreakEntry');

export const syncSessionEntrySchema = z
  .discriminatedUnion('type', [syncClimbEntrySchema, syncBreakEntrySchema])
  .openapi('SyncSessionEntry');

export const syncSessionPayloadSchema = z
  .object({
    id: z.uuid().openapi({
      example: '987fcdeb-51a2-43d7-9012-345678901234',
    }),
    gymId: z.uuid(),
    location: z.string().min(1).nullable().optional().openapi({
      description:
        'Wall or area label from the selected gym catalog; null when omitted or gym has no locations',
      example: 'Main Wall',
    }),
    startTime: isoDateTimeSchema.openapi({
      example: '2026-05-13T10:00:00.000Z',
    }),
    endTime: isoDateTimeSchema.openapi({
      example: '2026-05-13T12:00:00.000Z',
    }),
    totalDurationMs: z.number().int().nonnegative().openapi({
      example: 7_200_000,
    }),
    notes: z.string(),
    entries: z.array(syncSessionEntrySchema).openapi({
      description: 'Chronological list of climbs and breaks for this session',
    }),
  })
  .openapi('SyncSessionPayload');

export type SyncClimbAttempt = z.infer<typeof syncClimbAttemptSchema>;
export type SyncClimbEntry = z.infer<typeof syncClimbEntrySchema>;
export type SyncBreakEntry = z.infer<typeof syncBreakEntrySchema>;
export type SyncSessionEntry = z.infer<typeof syncSessionEntrySchema>;
export type SyncSessionPayload = z.infer<typeof syncSessionPayloadSchema>;

// --- Session history list ---

export const sessionHistoryCursorSchema = z
  .object({
    startTime: isoDateTimeSchema,
    id: z.uuid(),
  })
  .openapi('SessionHistoryCursor');

export const sessionHistoryListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: sessionHistoryCursorSchema.optional().openapi({
    description:
      'Keyset pagination cursor from the previous page nextCursor (startTime + id tie-breaker)',
  }),
});

export const sessionHistoryListItemSchema = z
  .object({
    id: z.uuid(),
    gymId: z.uuid(),
    gymName: z.string().min(1),
    location: z.string().min(1).nullable().optional(),
    startTime: isoDateTimeSchema,
    endTime: isoDateTimeSchema,
    totalDurationMs: z.number().int().nonnegative(),
    entryCount: z.number().int().nonnegative(),
  })
  .openapi('SessionHistoryListItem');

export const sessionHistoryListResponseSchema = z
  .object({
    items: z.array(sessionHistoryListItemSchema),
    nextCursor: sessionHistoryCursorSchema.nullable(),
  })
  .openapi('SessionHistoryListResponse');

export type SessionHistoryCursor = z.infer<typeof sessionHistoryCursorSchema>;
export type SessionHistoryListQuery = z.infer<
  typeof sessionHistoryListQuerySchema
>;
export type SessionHistoryListItem = z.infer<
  typeof sessionHistoryListItemSchema
>;
export type SessionHistoryListResponse = z.infer<
  typeof sessionHistoryListResponseSchema
>;

// --- Session detail ---

export const sessionDetailClimbEntrySchema = syncBaseEntrySchema
  .extend({
    type: z.literal('climb'),
    name: z.string().max(255),
    grade: z.string().max(50),
    attempts: z.number().int().positive().nullable(),
    notes: z.string(),
    images: z.array(syncedImageSchema),
  })
  .strict()
  .openapi('SessionDetailClimbEntry');

export const sessionDetailBreakEntrySchema = syncBaseEntrySchema
  .extend({
    type: z.literal('break'),
  })
  .strict()
  .openapi('SessionDetailBreakEntry');

export const sessionDetailEntrySchema = z
  .discriminatedUnion('type', [
    sessionDetailClimbEntrySchema,
    sessionDetailBreakEntrySchema,
  ])
  .openapi('SessionDetailEntry');

export const sessionDetailResponseSchema = z
  .object({
    id: z.uuid(),
    gymId: z.uuid(),
    gymName: z.string().min(1),
    location: z.string().min(1).nullable().optional(),
    startTime: isoDateTimeSchema,
    endTime: isoDateTimeSchema,
    totalDurationMs: z.number().int().nonnegative(),
    notes: z.string(),
    entries: z.array(sessionDetailEntrySchema).openapi({
      description:
        'Entries sorted by sequenceOrder; climb images sorted by index',
    }),
  })
  .openapi('SessionDetailResponse');

export type SessionDetailClimbEntry = z.infer<
  typeof sessionDetailClimbEntrySchema
>;
export type SessionDetailBreakEntry = z.infer<
  typeof sessionDetailBreakEntrySchema
>;
export type SessionDetailEntry = z.infer<typeof sessionDetailEntrySchema>;
export type SessionDetailResponse = z.infer<typeof sessionDetailResponseSchema>;

// --- Route params ---

export const sessionIdParamSchema = z
  .object({
    id: z.uuid().openapi({
      param: {
        name: 'id',
        in: 'path',
      },
      example: '987fcdeb-51a2-43d7-9012-345678901234',
    }),
  })
  .openapi('SessionIdParam');

export type SessionIdParam = z.infer<typeof sessionIdParamSchema>;

// --- Sync session response ---

export const syncSessionSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    sessionId: z.uuid().openapi({
      description: 'Synced session id (matches client payload id)',
    }),
  })
  .openapi('SyncSessionSuccessResponse');

export const apiErrorResponseSchema = z
  .object({
    success: z.literal(false),
    error: z.string(),
  })
  .openapi('ApiErrorResponse');

export type SyncSessionSuccessResponse = z.infer<
  typeof syncSessionSuccessResponseSchema
>;
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;
