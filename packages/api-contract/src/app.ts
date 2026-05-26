import { $, OpenAPIHono, type RouteHandler } from '@hono/zod-openapi';
import type { Env } from 'hono';
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

export const createApiContract = <E extends Env = Env>(
  handlers: ApiContractHandlers<E>,
) => {
  const healthHandler = async (
    c: Parameters<NonNullable<ApiContractHandlers<E>['health']>>[0],
  ) => {
    const response = await handlers.health?.(c);
    return c.json(response ?? { ok: true });
  };

  const app = $(
    new OpenAPIHono<E>()
      .get('/api/health', healthHandler)
      .get('/health', healthHandler),
  );

  const getGymsHandler: RouteHandler<typeof getGymsRoute, E> = async (c) =>
    c.json(await handlers.getGyms(c), 200);

  const createPresignedUploadHandler: RouteHandler<
    typeof createPresignedUploadRoute,
    E
  > = async (c) => {
    const body = c.req.valid('json');
    return c.json(await handlers.createPresignedUpload(c, body));
  };

  const syncSessionHandler: RouteHandler<typeof syncSessionRoute, E> = async (
    c,
  ) => {
    const body = c.req.valid('json');
    return c.json(await handlers.syncSession(c, body));
  };

  const listSessionsHandler: RouteHandler<typeof listSessionsRoute, E> = async (
    c,
  ) => {
    const query = c.req.valid('query');
    return c.json(await handlers.listSessions(c, query));
  };

  const getSessionDetailHandler: RouteHandler<
    typeof getSessionDetailRoute,
    E
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

// Derive the client type purely from the function signature so importing this
// module does not construct a real app instance with stub handlers at load time.
export type ApiAppType = ReturnType<typeof createApiContract>;

/** Default fetch init for browser clients (sends session cookies cross-origin). */
export const apiClientOptions = {
  init: {
    credentials: 'include',
  },
} as const satisfies Parameters<typeof hc>[1];

export const createApiClient = (
  baseUrl: string,
  options?: Parameters<typeof hc>[1],
) => hc<ApiAppType>(baseUrl, { ...apiClientOptions, ...options });
