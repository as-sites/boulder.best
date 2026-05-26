import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppDb } from '../src/db/index.js';
import { createApiApp } from '../src/index.js';

const gymMocks = vi.hoisted(() => ({
  listGyms: vi.fn(),
  restoreImplementations: () => {
    /* empty */
  },
}));

const mockCreateDb = vi.hoisted(() => vi.fn((): AppDb => ({}) as AppDb));

vi.mock(import('../src/gyms/list-gyms.js'), async (importOriginal) => {
  const actual = await importOriginal();
  const restore = () => {
    gymMocks.listGyms.mockImplementation(actual.listGyms);
  };
  gymMocks.restoreImplementations = restore;
  restore();
  return {
    listGyms: gymMocks.listGyms,
  };
});

vi.mock(import('../src/db/index.js'), () => ({
  createDb: mockCreateDb,
  getDb: mockCreateDb,
}));

const env = {
  GYMS_RATE_LIMITER: {
    limit: vi
      .fn<CloudflareBindings['GYMS_RATE_LIMITER']['limit']>()
      .mockResolvedValue({ success: true }),
  },
  BETTER_AUTH_SECRET: 'x'.repeat(32),
  BETTER_AUTH_URL: 'http://localhost:8787',
  FRONTEND_URL: 'http://localhost:5173',
  DATABASE_URL: 'postgresql://user:pass@host/db',
} satisfies Partial<CloudflareBindings>;

const { limit: rateLimitMock } = env.GYMS_RATE_LIMITER;

const gymId = 'a1b2c3d4-e5f6-4789-a234-56789abcdef0';
const updatedAt = new Date('2026-05-13T08:00:00.000Z');

const createGymsDb = (rows: Array<Record<string, unknown>>) => {
  const orderBy = vi.fn().mockResolvedValue(rows);
  const from = vi.fn(() => ({ orderBy }));
  const select = vi.fn(() => ({ from }));

  return {
    db: { select } as never,
    orderBy,
  };
};

describe('gyms list persistence', () => {
  beforeEach(() => {
    gymMocks.restoreImplementations();
    gymMocks.listGyms.mockClear();
  });

  it('returns gyms with ordered grades and ISO updatedAt', async () => {
    const mock = createGymsDb([
      {
        id: gymId,
        name: 'Boulder Central',
        grades: ['V0', 'V1', 'V2', 'V3'],
        locations: ['Main Wall'],
        updatedAt,
      },
    ]);

    const response = await gymMocks.listGyms(mock.db);

    expect(response).toEqual([
      {
        id: gymId,
        name: 'Boulder Central',
        grades: ['V0', 'V1', 'V2', 'V3'],
        locations: ['Main Wall'],
        updatedAt: '2026-05-13T08:00:00.000Z',
      },
    ]);
    expect(mock.orderBy).toHaveBeenCalled();
  });
});

const createAuthedApp = (
  userIdForSession: string | null,
  options?: Parameters<typeof createApiApp>[0],
) =>
  createApiApp({
    ...options,
    createAuthServer: () => ({
      handler: () => new Response(null),
      api: {
        getSession: vi.fn().mockResolvedValue(
          userIdForSession
            ? {
                user: { id: userIdForSession },
                session: { id: 'auth_session' },
              }
            : null,
        ),
      },
    }),
  });

describe('gyms routes', () => {
  beforeEach(() => {
    gymMocks.listGyms.mockClear();
    mockCreateDb.mockClear();
    gymMocks.restoreImplementations();
    rateLimitMock.mockReset().mockResolvedValue({ success: true });
  });

  afterEach(() => {
    gymMocks.restoreImplementations();
  });

  it('returns the read-only gym catalog without an authenticated session', async () => {
    const gyms = [
      {
        id: gymId,
        name: 'Boulder Central',
        grades: ['V0', 'V1', 'V2', 'V3'],
        locations: ['Main Wall'],
        updatedAt: '2026-05-13T08:00:00.000Z',
      },
    ];
    gymMocks.listGyms.mockResolvedValue(gyms);

    const app = createAuthedApp(null);
    const response = await app.request('/api/gyms', undefined, env);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(gyms);
    expect(gymMocks.listGyms).toHaveBeenCalledOnce();
    expect(mockCreateDb).toHaveBeenCalledWith(env.DATABASE_URL);
  });

  it('rate limits repeated unauthenticated requests from the same IP', async () => {
    const gyms = [
      {
        id: gymId,
        name: 'Boulder Central',
        grades: ['V0', 'V1', 'V2', 'V3'],
        locations: ['Main Wall'],
        updatedAt: '2026-05-13T08:00:00.000Z',
      },
    ];
    gymMocks.listGyms.mockResolvedValue(gyms);

    const app = createAuthedApp(null);
    rateLimitMock
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: false });

    const first = await app.request(
      '/api/gyms',
      {
        headers: {
          'CF-Connecting-IP': '203.0.113.11',
        },
      },
      env,
    );
    expect(first.status).toBe(200);

    const second = await app.request(
      '/api/gyms',
      {
        headers: {
          'CF-Connecting-IP': '203.0.113.11',
        },
      },
      env,
    );
    expect(second.status).toBe(429);
    await expect(second.json()).resolves.toEqual({
      success: false,
      error: 'Too many unauthenticated requests',
    });
    expect(gymMocks.listGyms).toHaveBeenCalledOnce();
  });

  it('returns the read-only gym catalog for authenticated users', async () => {
    const gyms = [
      {
        id: gymId,
        name: 'Boulder Central',
        grades: ['V0', 'V1', 'V2', 'V3'],
        locations: ['Main Wall'],
        updatedAt: '2026-05-13T08:00:00.000Z',
      },
    ];
    gymMocks.listGyms.mockResolvedValue(gyms);

    const app = createAuthedApp('user_123');
    const response = await app.request('/api/gyms', undefined, env);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(gyms);
    expect(gymMocks.listGyms).toHaveBeenCalledOnce();
    expect(mockCreateDb).toHaveBeenCalledWith(env.DATABASE_URL);
  });

  it('does not rate limit authenticated requests', async () => {
    const gyms = [
      {
        id: gymId,
        name: 'Boulder Central',
        grades: ['V0', 'V1', 'V2', 'V3'],
        locations: ['Main Wall'],
        updatedAt: '2026-05-13T08:00:00.000Z',
      },
    ];
    gymMocks.listGyms.mockResolvedValue(gyms);

    const app = createAuthedApp('user_123');
    rateLimitMock.mockResolvedValueOnce({ success: false });

    const first = await app.request('/api/gyms', undefined, env);
    const second = await app.request('/api/gyms', undefined, env);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(gymMocks.listGyms).toHaveBeenCalledTimes(2);
    expect(rateLimitMock).not.toHaveBeenCalled();
  });
});
