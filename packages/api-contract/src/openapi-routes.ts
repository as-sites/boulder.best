import { createRoute } from '@hono/zod-openapi';
import {
  apiErrorResponseSchema,
  gymsResponseSchema,
  presignedUploadRequestSchema,
  presignedUploadResponseSchema,
  sessionDetailResponseSchema,
  sessionHistoryListQuerySchema,
  sessionHistoryListResponseSchema,
  sessionIdParamSchema,
  syncSessionPayloadSchema,
  syncSessionSuccessResponseSchema,
} from './schemas.js';

const authenticatedSecurity = [{ sessionCookie: [] }];

export const getGymsRoute = createRoute({
  method: 'get',
  path: '/api/gyms',
  tags: ['Gyms'],
  summary: 'List gyms',
  description:
    'Returns the read-only gym catalog with grade scales for online use and offline cache hydration.',
  responses: {
    200: {
      description: 'Available gyms',
      content: {
        'application/json': {
          schema: gymsResponseSchema,
        },
      },
    },
    429: {
      description: 'Too many requests',
      content: {
        'application/json': {
          schema: apiErrorResponseSchema,
        },
      },
    },
  },
});

export const createPresignedUploadRoute = createRoute({
  method: 'post',
  path: '/api/uploads/presigned-url',
  tags: ['Uploads'],
  summary: 'Create presigned R2 upload URL',
  description:
    'Returns a temporary upload URL and final image metadata for a client-side Dexie image blob.',
  security: authenticatedSecurity,
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: presignedUploadRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Presigned upload URL generated',
      content: {
        'application/json': {
          schema: presignedUploadResponseSchema,
        },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': {
          schema: apiErrorResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
  },
});

export const syncSessionRoute = createRoute({
  method: 'post',
  path: '/api/sessions/sync',
  tags: ['Sessions'],
  summary: 'Sync an offline session',
  description:
    'Upserts a completed session payload from the offline sync queue for the authenticated user.',
  security: authenticatedSecurity,
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: syncSessionPayloadSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Session synced successfully',
      content: {
        'application/json': {
          schema: syncSessionSuccessResponseSchema,
        },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': {
          schema: apiErrorResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
  },
});

export const listSessionsRoute = createRoute({
  method: 'get',
  path: '/api/sessions',
  tags: ['Sessions'],
  summary: 'List session history',
  description:
    'Returns paginated session summaries for the authenticated user, newest first by startTime.',
  security: authenticatedSecurity,
  request: {
    query: sessionHistoryListQuerySchema,
  },
  responses: {
    200: {
      description: 'Paginated session history',
      content: {
        'application/json': {
          schema: sessionHistoryListResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
  },
});

export const getSessionDetailRoute = createRoute({
  method: 'get',
  path: '/api/sessions/{id}',
  tags: ['Sessions'],
  summary: 'Get session detail',
  description:
    'Returns a single session with entries ordered by sequenceOrder and climb images ordered by index.',
  security: authenticatedSecurity,
  request: {
    params: sessionIdParamSchema,
  },
  responses: {
    200: {
      description: 'Session detail',
      content: {
        'application/json': {
          schema: sessionDetailResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Session not found',
    },
  },
});

export const deleteSessionRoute = createRoute({
  method: 'delete',
  path: '/api/sessions/{id}',
  tags: ['Sessions'],
  summary: 'Delete a session',
  description:
    'Permanently deletes a session and all its entries for the authenticated user.',
  security: authenticatedSecurity,
  request: {
    params: sessionIdParamSchema,
  },
  responses: {
    204: {
      description: 'Session deleted',
    },
    401: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Session not found',
    },
  },
});

/** MVP OpenAPI route definitions registered on the shared contract app. */
export const mvpOpenApiRoutes = [
  getGymsRoute,
  createPresignedUploadRoute,
  syncSessionRoute,
  listSessionsRoute,
  getSessionDetailRoute,
  deleteSessionRoute,
] as const;
