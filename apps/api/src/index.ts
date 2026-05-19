import { createApiContract } from '@boulder/api-contract';
import {
  createAuth,
  type AuthEnvBindings,
  type AuthServer,
} from '@boulder/auth';
import { Hono, type Context, type MiddlewareHandler } from 'hono';
import { cors } from 'hono/cors';
import { getDb } from './db/index.js';
import { listGyms as loadGyms } from './gyms/list-gyms.js';
import {
  getSessionDetail as loadSessionDetail,
  listSessions as loadSessionHistory,
} from './sessions/session-history.js';
import {
  SyncSessionForbiddenError,
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

interface CreateApiAppOptions {
  createAuthServer?: CreateAuthServer;
}

export const createApiApp = (options: CreateApiAppOptions = {}) => {
  const createAuthServer = options.createAuthServer ?? createAuth;
  const app = new Hono<ApiEnv>();

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

  const protectedMiddleware = createProtectedUserMiddleware(createAuthServer);
  app.use('/api/gyms', protectedMiddleware);
  app.use('/api/uploads/*', protectedMiddleware);
  app.use('/api/sessions', protectedMiddleware);
  app.use('/api/sessions/*', protectedMiddleware);

  app.onError((error, c) => {
    if (error instanceof SyncSessionForbiddenError) {
      return c.body(null, 403);
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
