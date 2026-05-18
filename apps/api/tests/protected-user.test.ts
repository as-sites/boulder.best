import { describe, expect, it, vi } from 'vitest';
import type { AuthEnvBindings, AuthServer } from '@boulder/auth';
import { Hono } from 'hono';
import { createProtectedUserMiddleware } from '../src/index.js';

const env = {
  BETTER_AUTH_SECRET: 'x'.repeat(32),
  BETTER_AUTH_URL: 'http://localhost:8787',
  FRONTEND_URL: 'http://localhost:5173',
  DATABASE_URL: 'postgresql://user:pass@host/db',
} satisfies AuthEnvBindings;

const createTestApp = (auth: AuthServer) => {
  const app = new Hono<{
    Bindings: AuthEnvBindings;
    Variables: {
      userId: string;
    };
  }>();

  app.get(
    '/protected',
    createProtectedUserMiddleware(() => auth),
    (c) => c.json({ userId: c.get('userId') }),
  );

  return app;
};

describe('protected user middleware', () => {
  it('returns 401 when auth headers are missing', async () => {
    const getSession = vi.fn().mockResolvedValue(null);
    const app = createTestApp({
      handler: () => new Response(null),
      api: { getSession },
    });

    const response = await app.request('/protected', undefined, env);

    expect(response.status).toBe(401);
    expect(getSession).toHaveBeenCalledWith({
      headers: expect.any(Headers),
    });
  });

  it('returns 401 when auth headers do not resolve to a valid session', async () => {
    const getSession = vi.fn().mockResolvedValue(null);
    const app = createTestApp({
      handler: () => new Response(null),
      api: { getSession },
    });

    const response = await app.request(
      '/protected',
      {
        headers: {
          Authorization: 'Bearer invalid',
        },
      },
      env,
    );

    expect(response.status).toBe(401);
    expect(getSession).toHaveBeenCalledWith({
      headers: expect.any(Headers),
    });
  });

  it('stores the authenticated user ID when a valid session is present', async () => {
    const app = createTestApp({
      handler: () => new Response(null),
      api: {
        getSession: vi.fn().mockResolvedValue({
          user: { id: 'user_123' },
          session: { id: 'session_123' },
        }),
      },
    });

    const response = await app.request('/protected', undefined, env);

    await expect(response.json()).resolves.toEqual({ userId: 'user_123' });
  });
});
