import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthEnvBindings } from '@boulder/auth';
import type { AppDb } from '../src/db/index.js';
import type * as ListGymsModule from '../src/gyms/list-gyms.js';
import { createApiApp } from '../src/index.js';

const gymMocks = vi.hoisted(() => ({
  listGyms: vi.fn(),
  restoreImplementations: (() => {
    /* empty */
  }) as () => void,
}));

const mockCreateDb = vi.hoisted(() => vi.fn((): AppDb => ({}) as AppDb));

vi.mock(import('../src/gyms/list-gyms.js'), async (importOriginal) => {
  const actual = await importOriginal<typeof ListGymsModule>();
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
}));

const env = {
  BETTER_AUTH_SECRET: 'x'.repeat(32),
  BETTER_AUTH_URL: 'http://localhost:8787',
  FRONTEND_URL: 'http://localhost:5173',
  DATABASE_URL: 'postgresql://user:pass@host/db',
} satisfies AuthEnvBindings;

const gymId = 'a1b2c3d4-e5f6-4789-a234-56789abcdef0';
const updatedAt = new Date('2026-05-13T08:00:00.000Z');

function createGymsDb(rows: Array<Record<string, unknown>>) {
  const orderBy = vi.fn().mockResolvedValue(rows);
  const from = vi.fn(() => ({ orderBy }));
  const select = vi.fn(() => ({ from }));

  return {
    db: { select } as never,
    orderBy,
  };
}

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
        updatedAt,
      },
    ]);

    const response = await gymMocks.listGyms(mock.db);

    expect(response).toEqual([
      {
        id: gymId,
        name: 'Boulder Central',
        grades: ['V0', 'V1', 'V2', 'V3'],
        updatedAt: '2026-05-13T08:00:00.000Z',
      },
    ]);
    expect(mock.orderBy).toHaveBeenCalled();
  });
});

describe('gyms routes', () => {
  beforeEach(() => {
    gymMocks.listGyms.mockClear();
    mockCreateDb.mockClear();
    gymMocks.restoreImplementations();
  });

  afterEach(() => {
    gymMocks.restoreImplementations();
  });

  function createAuthedApp(userIdForSession: string | null) {
    return createApiApp({
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
  }

  it('returns 401 without an authenticated session', async () => {
    const app = createAuthedApp(null);
    const response = await app.request('/api/gyms');

    expect(response.status).toBe(401);
    expect(gymMocks.listGyms).not.toHaveBeenCalled();
  });

  it('returns the read-only gym catalog for authenticated users', async () => {
    const gyms = [
      {
        id: gymId,
        name: 'Boulder Central',
        grades: ['V0', 'V1', 'V2', 'V3'],
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
});
