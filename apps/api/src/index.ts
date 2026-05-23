import { createApiContract } from '@boulder/api-contract';
import {
  createAuth,
  type AuthEnvBindings,
  type AuthServer,
} from '@boulder/auth';
import { sentry } from '@sentry/hono/cloudflare';
import { Hono, type Context, type MiddlewareHandler } from 'hono';
import { cors } from 'hono/cors';
import { getDb } from './db/index.js';
import { listGyms as loadGyms } from './gyms/list-gyms.js';
import { createApiSentryOptions } from './lib/sentry.js';
import {
  getSessionDetail as loadSessionDetail,
  listSessions as loadSessionHistory,
} from './sessions/session-history.js';
import {
  SyncSessionForbiddenError,
  SyncSessionInvalidLocationError,
  syncSession as persistSyncedSession,
} from './sessions/sync-session.js';
import { createPresignedUpload as generatePresignedUpload } from './uploads/create-presigned-upload.js';

interface ApiVariables {
  userId: string;
}

interface ApiEnv {
  Bindings: CloudflareBindings;
  Variables: ApiVariables;
}

type CreateAuthServer = (env: AuthEnvBindings) => AuthServer;

export interface AuthenticatedUser {
  userId: string;
}

interface UnauthenticatedGymsRateLimitOptions {
  maxRequests: number;
  windowMs: number;
  now: () => number;
}

const defaultUnauthenticatedGymsRateLimit: UnauthenticatedGymsRateLimitOptions =
  {
    maxRequests: 60,
    windowMs: 60_000,
    now: () => Date.now(),
  };

interface UnauthenticatedGymsRateLimitState {
  count: number;
  resetAt: number;
}

const getRequestRateLimitKey = (request: Request): string => {
  const cfConnectingIp = request.headers.get('CF-Connecting-IP');

  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  const forwardedFor = request.headers.get('X-Forwarded-For');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() ?? 'unknown';
  }

  return 'unknown';
};

export const getAuthenticatedUser = async (
  c: Context<ApiEnv>,
  auth: AuthServer,
): Promise<AuthenticatedUser | Response> => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    return c.body(null, 401);
  }

  return { userId: session.user.id };
};

export const createProtectedUserMiddleware =
  (
    createAuthServer: CreateAuthServer = createAuth,
  ): MiddlewareHandler<ApiEnv> =>
  async (c, next) => {
    const user = await getAuthenticatedUser(c, createAuthServer(c.env));

    if (user instanceof Response) {
      return user;
    }

    c.set('userId', user.userId);
    await next();
  };

const createUnauthenticatedGymsRateLimitMiddleware = (
  createAuthServer: CreateAuthServer,
  options: Partial<UnauthenticatedGymsRateLimitOptions> = {},
): MiddlewareHandler<ApiEnv> => {
  const config = {
    ...defaultUnauthenticatedGymsRateLimit,
    ...options,
  };
  const rateLimitByKey = new Map<string, UnauthenticatedGymsRateLimitState>();

  return async (c, next) => {
    const session = await createAuthServer(c.env).api.getSession({
      headers: c.req.raw.headers,
    });

    if (session) {
      await next();
      return;
    }

    const now = config.now();
    const key = getRequestRateLimitKey(c.req.raw);
    const existing = rateLimitByKey.get(key);

    if (!existing || now >= existing.resetAt) {
      rateLimitByKey.set(key, {
        count: 1,
        resetAt: now + config.windowMs,
      });
      await next();
      return;
    }

    if (existing.count >= config.maxRequests) {
      c.header(
        'Retry-After',
        Math.max(1, Math.ceil((existing.resetAt - now) / 1000)).toString(),
      );
      return c.json(
        {
          success: false,
          error: 'Too many unauthenticated requests',
        },
        429,
      );
    }

    existing.count += 1;
    await next();
  };
};

interface CreateApiAppOptions {
  createAuthServer?: CreateAuthServer;
  unauthenticatedGymsRateLimit?: Partial<UnauthenticatedGymsRateLimitOptions>;
}

export const createApiApp = (options: CreateApiAppOptions = {}) => {
  const createAuthServer = options.createAuthServer ?? createAuth;
  const app = new Hono<ApiEnv>();

  app.use(
    sentry(
      app,
      (env) => createApiSentryOptions(env) ?? { dsn: '', tracesSampleRate: 0 },
    ),
  );

  app.use(
    '/api/auth/*',
    cors({
      origin: (origin, c) => {
        const allowed = c.env.FRONTEND_URL;
        return origin === allowed ? origin : null;
      },
      allowHeaders: ['Content-Type', 'Authorization'],
      allowMethods: ['GET', 'POST', 'OPTIONS'],
      maxAge: 600,
      credentials: true,
    }),
  );

  app.on(
    ['POST', 'GET'],
    '/api/auth/*',
    async (c) => await createAuthServer(c.env).handler(c.req.raw),
  );

  app.use(
    '/api/gyms',
    createUnauthenticatedGymsRateLimitMiddleware(
      createAuthServer,
      options.unauthenticatedGymsRateLimit,
    ),
  );

  const protectedMiddleware = createProtectedUserMiddleware(createAuthServer);
  app.use('/api/uploads/*', protectedMiddleware);
  app.use('/api/sessions', protectedMiddleware);
  app.use('/api/sessions/*', protectedMiddleware);

  app.onError((error, c) => {
    if (error instanceof SyncSessionForbiddenError) {
      return c.body(null, 403);
    }

    if (error instanceof SyncSessionInvalidLocationError) {
      return c.body(null, 400);
    }

    throw error;
  });

  app.route(
    '/',
    createApiContract<ApiEnv>({
      hello: () => ({
        message: 'Hello from the Boulder API.',
      }),
      getGyms: async (c) => {
        const db = getDb(c.env.DATABASE_URL);
        return await loadGyms(db);
      },
      createPresignedUpload: async (c, body) => {
        const userId = c.get('userId');

        return await generatePresignedUpload({
          userId,
          body,
          photoUrlBase: c.env.PUBLIC_PHOTO_URL_BASE,
          r2: {
            accountId: c.env.R2_ACCOUNT_ID,
            bucketName: c.env.R2_BUCKET_NAME,
            accessKeyId: c.env.R2_ACCESS_KEY_ID,
            secretAccessKey: c.env.R2_SECRET_ACCESS_KEY,
          },
        });
      },
      syncSession: async (c, body) => {
        const db = getDb(c.env.DATABASE_URL);
        const userId = c.get('userId');
        return await persistSyncedSession(db, userId, body);
      },
      listSessions: async (c, query) => {
        const db = getDb(c.env.DATABASE_URL);
        const userId = c.get('userId');
        return await loadSessionHistory(db, userId, query);
      },
      getSessionDetail: async (c, params) => {
        const db = getDb(c.env.DATABASE_URL);
        const userId = c.get('userId');
        return await loadSessionDetail(db, userId, params.id);
      },
    }),
  );

  return app;
};

const app = createApiApp();

// oxlint-disable-next-line import/no-default-export
export default app;
