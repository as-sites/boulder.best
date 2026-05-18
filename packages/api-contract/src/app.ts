import { $, OpenAPIHono, type RouteHandler } from '@hono/zod-openapi';
import { hc } from 'hono/client';
import {
  createPresignedUploadRoute,
  getGymsRoute,
  getSessionDetailRoute,
  listSessionsRoute,
  syncSessionRoute,
} from './openapi-routes.js';
import { openApiDocumentConfig, openApiJsonPath } from './openapi.js';
import type { ApiContractHandlers } from './routes.js';

export const createApiContract = (handlers: ApiContractHandlers) => {
  const healthHandler = async (
    c: Parameters<ApiContractHandlers['hello']>[0],
  ) => {
    const response = await handlers.health?.(c);
    return c.json(response ?? { ok: true });
  };

  const app = $(
    new OpenAPIHono()
      .get('/api/hello', async (c) => c.json(await handlers.hello(c)))
      .get('/api/health', healthHandler)
      .get('/health', healthHandler),
  );

  const getGymsHandler: RouteHandler<typeof getGymsRoute> = async (c) =>
    c.json(await handlers.getGyms(c));

  const createPresignedUploadHandler: RouteHandler<
    typeof createPresignedUploadRoute
  > = async (c) => {
    const body = c.req.valid('json');
    return c.json(await handlers.createPresignedUpload(c, body));
  };

  const syncSessionHandler: RouteHandler<typeof syncSessionRoute> = async (
    c,
  ) => {
    const body = c.req.valid('json');
    return c.json(await handlers.syncSession(c, body));
  };

  const listSessionsHandler: RouteHandler<typeof listSessionsRoute> = async (
    c,
  ) => {
    const query = c.req.valid('query');
    return c.json(await handlers.listSessions(c, query));
  };

  const getSessionDetailHandler: RouteHandler<
    typeof getSessionDetailRoute
  > = async (c) => {
    const params = c.req.valid('param');
    const detail = await handlers.getSessionDetail(c, params);

    if (detail === null) {
      return c.body(null, 404);
    }

    return c.json(detail);
  };

  return app
    .openapi(getGymsRoute, getGymsHandler)
    .openapi(createPresignedUploadRoute, createPresignedUploadHandler)
    .openapi(syncSessionRoute, syncSessionHandler)
    .openapi(listSessionsRoute, listSessionsHandler)
    .openapi(getSessionDetailRoute, getSessionDetailHandler)
    .doc(openApiJsonPath, openApiDocumentConfig);
};

const contractTypeApp = createApiContract({
  hello: () => ({ message: '' }),
  getGyms: () => [],
  createPresignedUpload: () => ({
    uploadUrl: 'https://example.com/upload',
    objectKey: 'key',
    photoUrl: 'https://example.com/photo',
    image: {
      id: '123e4567-e89b-12d3-a456-426614174001',
      index: 0,
      objectKey: 'key',
      photoUrl: 'https://example.com/photo',
      contentType: 'image/webp',
      contentLength: 1,
    },
  }),
  syncSession: () => ({
    success: true,
    sessionId: '987fcdeb-51a2-43d7-9012-345678901234',
  }),
  listSessions: () => ({ items: [], nextCursor: null }),
  getSessionDetail: () => null,
});

export type ApiAppType = typeof contractTypeApp;

/** Default fetch init for browser clients (sends session cookies cross-origin). */
export const apiClientOptions = {
  init: {
    credentials: 'include',
  },
} as const satisfies Parameters<typeof hc>[1];

export const createApiClient = (baseUrl: string) =>
  hc<ApiAppType>(baseUrl, apiClientOptions);
