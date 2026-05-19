import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthEnvBindings } from '@boulder/auth';
import type { AppDb } from '../src/db/index.js';
import { createApiApp } from '../src/index.js';
import type * as SessionHistoryModule from '../src/sessions/session-history.js';

const historyMocks = vi.hoisted(() => ({
  listSessions: vi.fn(),
  getSessionDetail: vi.fn(),
  restoreImplementations: (() => {
    /* empty */
  }) as () => void,
}));

const mockCreateDb = vi.hoisted(() => vi.fn((): AppDb => ({}) as AppDb));

vi.mock(
  import('../src/sessions/session-history.js'),
  async (importOriginal) => {
    const actual = await importOriginal<typeof SessionHistoryModule>();
    const restore = () => {
      historyMocks.listSessions.mockImplementation(actual.listSessions);
      historyMocks.getSessionDetail.mockImplementation(actual.getSessionDetail);
    };
    historyMocks.restoreImplementations = restore;
    restore();
    return {
      listSessions: historyMocks.listSessions,
      getSessionDetail: historyMocks.getSessionDetail,
    };
  },
);

vi.mock(import('../src/db/index.js'), () => ({
  createDb: mockCreateDb,
  getDb: mockCreateDb,
}));

const env = {
  BETTER_AUTH_SECRET: 'x'.repeat(32),
  BETTER_AUTH_URL: 'http://localhost:8787',
  FRONTEND_URL: 'http://localhost:5173',
  DATABASE_URL: 'postgresql://user:pass@host/db',
} satisfies AuthEnvBindings;

const userId = 'user_123';
const otherUserId = 'user_456';
const sessionId = '987fcdeb-51a2-43d7-9012-345678901234';
const gymId = 'a1b2c3d4-e5f6-4789-a234-56789abcdef0';
const climbEntryId = '123e4567-e89b-12d3-a456-426614174000';
const breakEntryId = '423e4567-e89b-12d3-a456-426614174003';

const newerStartTime = new Date('2026-05-14T10:00:00.000Z');
const olderStartTime = new Date('2026-05-13T10:00:00.000Z');

const createListDb = (rows: Array<Record<string, unknown>>) => {
  const limit = vi.fn().mockResolvedValue(rows);

  const orderBy = vi.fn(() => ({ limit }));
  const groupBy = vi.fn(() => ({ orderBy }));
  const where = vi.fn(() => ({ groupBy }));
  const leftJoin = vi.fn(() => ({ where }));
  const innerJoin = vi.fn(() => ({ leftJoin }));
  const from = vi.fn(() => ({ innerJoin }));
  const select = vi.fn(() => ({ from }));

  return {
    db: { select } as never,
    limit,
    where,
  };
};

const createDetailDb = (options: {
  session?: Record<string, unknown> | null;
  entries?: Array<Record<string, unknown>>;
  images?: Array<Record<string, unknown>>;
  attemptCounts?: Array<{ entryId: string; attempts: number }>;
}) => {
  let selectCall = 0;

  const db = {
    select: vi.fn(() => {
      selectCall += 1;

      if (selectCall === 1) {
        return {
          from: vi.fn(() => ({
            innerJoin: vi.fn(() => ({
              where: vi.fn(() => ({
                limit: vi.fn(async () =>
                  options.session ? [options.session] : [],
                ),
              })),
            })),
          })),
        };
      }

      if (selectCall === 2) {
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              orderBy: vi.fn(async () => options.entries ?? []),
            })),
          })),
        };
      }

      if (selectCall === 3) {
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              orderBy: vi.fn(async () => options.images ?? []),
            })),
          })),
        };
      }

      return {
        from: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            where: vi.fn(() => ({
              groupBy: vi.fn(async () =>
                (options.attemptCounts ?? []).map((row) => ({
                  entryId: row.entryId,
                  attempts: row.attempts,
                })),
              ),
            })),
          })),
        })),
      };
    }),
  };

  return { db: db as never };
};

describe('session history list persistence', () => {
  beforeEach(() => {
    historyMocks.restoreImplementations();
    historyMocks.listSessions.mockClear();
    historyMocks.getSessionDetail.mockClear();
  });

  it('returns paginated list items scoped to the user', async () => {
    const mock = createListDb([
      {
        id: sessionId,
        gymId,
        gymName: 'Boulder Central',
        startTime: newerStartTime,
        endTime: new Date('2026-05-14T12:00:00.000Z'),
        totalDurationMs: 7_200_000,
        entryCount: 2,
      },
    ]);

    const response = await historyMocks.listSessions(mock.db, userId, {
      limit: 20,
    });

    expect(response).toEqual({
      items: [
        {
          id: sessionId,
          gymId,
          gymName: 'Boulder Central',
          startTime: '2026-05-14T10:00:00.000Z',
          endTime: '2026-05-14T12:00:00.000Z',
          totalDurationMs: 7_200_000,
          entryCount: 2,
        },
      ],
      nextCursor: null,
    });
    expect(mock.limit).toHaveBeenCalledWith(21);
  });

  it('returns a next cursor when more sessions exist', async () => {
    const mock = createListDb([
      {
        id: sessionId,
        gymId,
        gymName: 'Boulder Central',
        startTime: newerStartTime,
        endTime: new Date('2026-05-14T12:00:00.000Z'),
        totalDurationMs: 7_200_000,
        entryCount: 2,
      },
      {
        id: '11111111-1111-4111-8111-111111111111',
        gymId,
        gymName: 'Boulder Central',
        startTime: olderStartTime,
        endTime: new Date('2026-05-13T12:00:00.000Z'),
        totalDurationMs: 3_600_000,
        entryCount: 1,
      },
    ]);

    const response = await historyMocks.listSessions(mock.db, userId, {
      limit: 1,
    });

    expect(response.items).toHaveLength(1);
    expect(response.nextCursor).toBe('2026-05-14T10:00:00.000Z');
    expect(mock.limit).toHaveBeenCalledWith(2);
  });
});

describe('session detail persistence', () => {
  beforeEach(() => {
    historyMocks.restoreImplementations();
    historyMocks.listSessions.mockClear();
    historyMocks.getSessionDetail.mockClear();
  });

  it('returns ordered entries, images, and attempt counts for the user session', async () => {
    const mock = createDetailDb({
      session: {
        id: sessionId,
        gymId,
        gymName: 'Boulder Central',
        startTime: olderStartTime,
        endTime: new Date('2026-05-13T12:00:00.000Z'),
        totalDurationMs: 7_200_000,
        notes: 'Felt strong today.',
      },
      entries: [
        {
          id: climbEntryId,
          sequenceOrder: 0,
          durationMs: 45_000,
          type: 'climb',
          name: 'Pink corner route',
          grade: 'V3',
          completed: true,
          notes: null,
        },
        {
          id: breakEntryId,
          sequenceOrder: 1,
          durationMs: 300_000,
          type: 'break',
          name: null,
          grade: null,
          completed: null,
          notes: null,
        },
      ],
      images: [
        {
          id: '223e4567-e89b-12d3-a456-426614174001',
          entryId: climbEntryId,
          index: 1,
          objectKey: 'user/session/entry/1.webp',
          photoUrl: 'https://cdn.example.com/1.webp',
          contentType: 'image/webp',
          contentLength: 256_000,
        },
        {
          id: '323e4567-e89b-12d3-a456-426614174002',
          entryId: climbEntryId,
          index: 0,
          objectKey: 'user/session/entry/0.webp',
          photoUrl: 'https://cdn.example.com/0.webp',
          contentType: 'image/jpeg',
          contentLength: 512_000,
        },
      ],
      attemptCounts: [{ entryId: climbEntryId, attempts: 2 }],
    });

    const response = await historyMocks.getSessionDetail(
      mock.db,
      userId,
      sessionId,
    );

    expect(response).toEqual({
      id: sessionId,
      gymId,
      gymName: 'Boulder Central',
      startTime: '2026-05-13T10:00:00.000Z',
      endTime: '2026-05-13T12:00:00.000Z',
      totalDurationMs: 7_200_000,
      notes: 'Felt strong today.',
      entries: [
        {
          id: climbEntryId,
          sequenceOrder: 0,
          durationMs: 45_000,
          type: 'climb',
          name: 'Pink corner route',
          grade: 'V3',
          attempts: 2,
          completed: true,
          images: [
            {
              id: '223e4567-e89b-12d3-a456-426614174001',
              index: 1,
              objectKey: 'user/session/entry/1.webp',
              photoUrl: 'https://cdn.example.com/1.webp',
              contentType: 'image/webp',
              contentLength: 256_000,
            },
            {
              id: '323e4567-e89b-12d3-a456-426614174002',
              index: 0,
              objectKey: 'user/session/entry/0.webp',
              photoUrl: 'https://cdn.example.com/0.webp',
              contentType: 'image/jpeg',
              contentLength: 512_000,
            },
          ],
        },
        {
          id: breakEntryId,
          sequenceOrder: 1,
          durationMs: 300_000,
          type: 'break',
        },
      ],
    });
  });

  it('returns null when the session is not owned by the user', async () => {
    const mock = createDetailDb({ session: null });

    await expect(
      historyMocks.getSessionDetail(mock.db, userId, sessionId),
    ).resolves.toBeNull();
  });
});

describe('session history routes', () => {
  beforeEach(() => {
    historyMocks.listSessions.mockClear();
    historyMocks.getSessionDetail.mockClear();
    mockCreateDb.mockClear();
    historyMocks.restoreImplementations();
  });

  afterEach(() => {
    historyMocks.restoreImplementations();
  });

  const createAuthedApp = (userIdForSession: string | null) =>
    createApiApp({
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

  it('returns 401 without an authenticated session for list and detail', async () => {
    const app = createAuthedApp(null);

    const listResponse = await app.request('/api/sessions');
    const detailResponse = await app.request(`/api/sessions/${sessionId}`);

    expect(listResponse.status).toBe(401);
    expect(detailResponse.status).toBe(401);
    expect(historyMocks.listSessions).not.toHaveBeenCalled();
    expect(historyMocks.getSessionDetail).not.toHaveBeenCalled();
  });

  it('scopes history reads to the authenticated user', async () => {
    historyMocks.listSessions.mockResolvedValue({
      items: [],
      nextCursor: null,
    });
    historyMocks.getSessionDetail.mockResolvedValue(null);

    const app = createAuthedApp(userId);
    const listResponse = await app.request(
      '/api/sessions?limit=10',
      undefined,
      env,
    );
    const detailResponse = await app.request(
      `/api/sessions/${sessionId}`,
      undefined,
      env,
    );

    expect(listResponse.status).toBe(200);
    expect(detailResponse.status).toBe(404);
    expect(historyMocks.listSessions).toHaveBeenCalledWith(
      expect.anything(),
      userId,
      expect.objectContaining({ limit: 10 }),
    );
    expect(historyMocks.getSessionDetail).toHaveBeenCalledWith(
      expect.anything(),
      userId,
      sessionId,
    );
    expect(historyMocks.listSessions).toHaveBeenCalledOnce();
    expect(historyMocks.getSessionDetail).toHaveBeenCalledOnce();
    expect(mockCreateDb).toHaveBeenCalled();
  });

  it('returns 404 when the authenticated user does not own the session', async () => {
    historyMocks.getSessionDetail.mockResolvedValue(null);

    const app = createAuthedApp(userId);
    const deniedResponse = await app.request(
      `/api/sessions/${sessionId}`,
      undefined,
      env,
    );

    expect(deniedResponse.status).toBe(404);
    expect(historyMocks.getSessionDetail).toHaveBeenCalledWith(
      expect.anything(),
      userId,
      sessionId,
    );
  });

  it('returns session detail only for the owning user', async () => {
    const ownedSession = {
      id: sessionId,
      gymId,
      gymName: 'Boulder Central',
      startTime: '2026-05-13T10:00:00.000Z',
      endTime: '2026-05-13T12:00:00.000Z',
      totalDurationMs: 7_200_000,
      entries: [],
    };
    historyMocks.getSessionDetail.mockResolvedValue(ownedSession);

    const otherUserApp = createAuthedApp(otherUserId);
    const allowedResponse = await otherUserApp.request(
      `/api/sessions/${sessionId}`,
      undefined,
      env,
    );

    expect(allowedResponse.status).toBe(200);
    await expect(allowedResponse.json()).resolves.toEqual(ownedSession);
    expect(historyMocks.getSessionDetail).toHaveBeenCalledWith(
      expect.anything(),
      otherUserId,
      sessionId,
    );
  });
});
