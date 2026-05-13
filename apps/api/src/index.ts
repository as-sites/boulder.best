import { createApiContract } from '@boulder/api-contract';
import { createAuth } from '@boulder/auth';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono<{ Bindings: CloudflareBindings }>();

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
  ['GET', 'POST'],
  '/api/auth/*',
  async (c) => await createAuth(c.env).handler(c.req.raw),
);

app.route(
  '/',
  createApiContract({
    hello: () => ({
      message: 'Hello from the Boulder API.',
    }),
  }),
);

// oxlint-disable-next-line import/no-default-export
export default app;
