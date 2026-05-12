import { createRoute, z } from '@hono/zod-openapi';
// Assuming the Zod schemas from the Canvas document are exported from a local file
import { SyncSessionPayloadSchema } from './hono-schemas';

// --- GYM ROUTES ---

export const getGymsRoute = createRoute({
  method: 'get',
  path: '/api/gyms',
  summary: 'Get global gym list',
  description:
    'Fetches the list of gyms and their grade scales to populate the frontend offline cache.',
  responses: {
    200: {
      description: 'List of available gyms',
      content: {
        'application/json': {
          schema: z.array(
            z.object({
              id: z.string().uuid(),
              name: z.string(),
              grades: z.array(z.string()),
              // Using Zod v4 strict datetime strings
              updatedAt: z.string().datetime(),
            }),
          ),
        },
      },
    },
  },
});

// --- SESSION ROUTES ---

export const syncSessionRoute = createRoute({
  method: 'post',
  path: '/api/sessions/sync',
  summary: 'Sync an offline session',
  description:
    'Receives a completed session payload from the offline PWA Dexie sync queue.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: SyncSessionPayloadSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Session successfully synced and saved to Postgres',
      content: {
        'application/json': {
          schema: z.object({
            success: z.literal(true),
            sessionId: z.string().uuid(),
          }),
        },
      },
    },
    400: {
      description: 'Validation Error (e.g., missing fields, invalid UUIDs)',
      content: {
        'application/json': {
          schema: z.object({
            success: z.literal(false),
            error: z.string(),
          }),
        },
      },
    },
    401: {
      description: 'Unauthorized - Invalid or missing authentication token',
    },
  },
});

export const getSessionsRoute = createRoute({
  method: 'get',
  path: '/api/sessions',
  summary: 'Get user sessions',
  description:
    'Fetches a paginated list of the authenticated user’s past sessions for the dashboard.',
  request: {
    query: z.object({
      limit: z.coerce.number().min(1).max(50).default(20),
      cursor: z.string().datetime().optional().openapi({
        description:
          'Timestamp of the last fetched session for cursor-based pagination',
      }),
    }),
  },
  responses: {
    200: {
      description: 'Paginated list of sessions',
      content: {
        'application/json': {
          schema: z.object({
            // Basic session data for list view (avoids sending the massive entries array)
            items: z.array(
              z.object({
                id: z.string().uuid(),
                gymId: z.string().uuid(),
                startTime: z.string().datetime(),
                totalDurationMs: z.number(),
                entryCount: z.number().int(),
              }),
            ),
            nextCursor: z.string().datetime().nullable(),
          }),
        },
      },
    },
  },
});

// --- UPLOAD ROUTES ---

export const getPresignedUrlRoute = createRoute({
  method: 'post',
  path: '/api/uploads/presigned-url',
  summary: 'Get R2 Presigned Upload URL',
  description:
    'Requests a temporary upload URL to safely push a local Dexie image blob directly to Cloudflare R2.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            contentType: z
              .string()
              .regex(
                /^image\/(jpeg|png|webp)$/,
                'Must be an image type (jpeg, png, webp)',
              ),
            contentLength: z
              .number()
              .max(30 * 1024 * 1024, 'File size cannot exceed 10MB'),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Presigned URL generated successfully',
      content: {
        'application/json': {
          schema: z.object({
            // The URL the client will make a PUT request to with the raw blob
            uploadUrl: z.string().url(),
            // The final static URL of the image once the upload is complete.
            // The client injects this into the `photoUrl` of the SyncSessionPayload.
            photoUrl: z.string().url(),
          }),
        },
      },
    },
  },
});
