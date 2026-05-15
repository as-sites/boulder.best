import { createApiContract } from '@boulder/api-contract';
import {
  createAuth,
  type AuthEnvBindings,
  type AuthServer,
} from '@boulder/auth';
import { Hono, type Context, type MiddlewareHandler } from 'hono';
import { cors } from 'hono/cors';

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

export async function getAuthenticatedUser(
  c: Context<ApiEnv>,
  auth: AuthServer,
): Promise<AuthenticatedUser | Response> {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    return c.body(null, 401);
  }

  return { userId: session.user.id };
}

export function createProtectedUserMiddleware(
  createAuthServer: CreateAuthServer = createAuth,
): MiddlewareHandler<ApiEnv> {
  return async (c, next) => {
    const user = await getAuthenticatedUser(c, createAuthServer(c.env));

    if (user instanceof Response) {
      return user;
    }

    c.set('userId', user.userId);
    await next();
  };
}

interface CreateApiAppOptions {
  createAuthServer?: CreateAuthServer;
}

export function createApiApp(options: CreateApiAppOptions = {}) {
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

  app.route(
    '/',
    createApiContract({
      hello: () => ({
        message: 'Hello from the Boulder API.',
      }),
    }),
  );

  return app;
}

const app = createApiApp();

// oxlint-disable-next-line import/no-default-export
export default app;
