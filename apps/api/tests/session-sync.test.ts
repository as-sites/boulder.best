import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getTableName } from 'drizzle-orm';
import type { AppDb } from '../src/db/index.js';
import { createApiApp } from '../src/index.js';
import type * as SyncSessionModule from '../src/sessions/sync-session.js';
import { SyncSessionForbiddenError } from '../src/sessions/sync-session.js';

const syncMocks = vi.hoisted(() => ({
  syncSession: vi.fn(),
}));

vi.mock(import('../src/sessions/sync-session.js'), async (importOriginal) => {
  const actual = await importOriginal<typeof SyncSessionModule>();
  syncMocks.syncSession.mockImplementation(actual.syncSession);
  return {
    ...actual,
    syncSession: syncMocks.syncSession,
  };
});

const mockCreateDb = vi.hoisted(() => vi.fn((): AppDb => ({}) as AppDb));

vi.mock(import('../src/db/index.js'), () => ({
  createDb: mockCreateDb,
  getDb: mockCreateDb,
}));

const syncSessionPayloadFixture = {
  id: '987fcdeb-51a2-43d7-9012-345678901234',
  gymId: 'a1b2c3d4-e5f6-4789-a234-56789abcdef0',
  startTime: '2026-05-13T10:00:00.000Z',
  endTime: '2026-05-13T12:00:00.000Z',
  totalDurationMs: 7_200_000,
  notes: 'Felt strong today.',
  entries: [
    {
      id: '123e4567-e89b-12d3-a456-426614174000',
      sequenceOrder: 0,
      durationMs: 45_000,
      type: 'climb' as const,
      name: 'Pink corner route',
      grade: 'V3',
      completed: true,
      notes: null,
      climbAttempts: [
        { sequenceOrder: 0, durationMs: 20_000, notes: 'Slipped on crux' },
        { sequenceOrder: 1, durationMs: 25_000, notes: null },
      ],
      images: [
        {
          id: '223e4567-e89b-12d3-a456-426614174001',
          index: 0,
          objectKey: 'user/session/entry/0.webp',
          photoUrl: 'https://cdn.example.com/0.webp',
          contentType: 'image/webp' as const,
          contentLength: 512_000,
        },
      ],
    },
    {
      id: '423e4567-e89b-12d3-a456-426614174003',
      sequenceOrder: 1,
      durationMs: 300_000,
      type: 'break' as const,
    },
  ],
} as const;

const createMockDb = (options: { existingUserId?: string } = {}) => {
  const sessionUpserts: unknown[] = [];
  const entryUpserts: unknown[] = [];
  const imageUpserts: unknown[] = [];
  const attemptInserts: Array<{ entryId: string; sequenceOrder: number }> = [];
  const attemptConflictUpdates: unknown[] = [];

  const tx = {
    select: vi.fn(() => ({
      from: vi.fn((table: Parameters<typeof getTableName>[0]) => ({
        where: vi.fn(() => ({
          limit: vi.fn(async () => {
            const tableName = getTableName(table);

            if (tableName === 'sessions') {
              return options.existingUserId
                ? [{ userId: options.existingUserId }]
                : [];
            }

            return [];
          }),
        })),
      })),
    })),
    insert: vi.fn((table: Parameters<typeof getTableName>[0]) => ({
      values: vi.fn((values: Record<string, unknown>) => {
        const tableName = getTableName(table);

        if (tableName === 'sessions') {
          sessionUpserts.push(values);
        }

        if (tableName === 'session_entries') {
          entryUpserts.push(values);
        }

        if (tableName === 'session_entry_images') {
          imageUpserts.push(values);
        }

        if (tableName === 'climb_attempts') {
          attemptInserts.push({
            entryId: values.entryId as string,
            sequenceOrder: values.sequenceOrder as number,
          });
        }

        return {
          onConflictDoUpdate: vi.fn(async (update) => {
            if (tableName === 'climb_attempts') {
              attemptConflictUpdates.push(update);
            }
          }),
        };
      }),
    })),
  };

  return {
    db: {
      transaction: vi.fn(
        async (callback: (innerTx: typeof tx) => Promise<void>) => {
          await callback(tx);
        },
      ),
    },
    sessionUpserts,
    entryUpserts,
    imageUpserts,
    attemptInserts,
    attemptConflictUpdates,
  };
};

describe('syncSession persistence', () => {
  beforeEach(() => {
    syncMocks.syncSession.mockClear();
  });

  it('upserts the session, entries, images, and climb attempts for the user', async () => {
    const { db, sessionUpserts, entryUpserts, imageUpserts, attemptInserts } =
      createMockDb();

    const response = await syncMocks.syncSession(
      db as never,
      'user_123',
      syncSessionPayloadFixture,
    );

    expect(response).toEqual({
      success: true,
      sessionId: syncSessionPayloadFixture.id,
    });
    expect(sessionUpserts).toHaveLength(1);
    expect(sessionUpserts[0]).toMatchObject({
      id: syncSessionPayloadFixture.id,
      userId: 'user_123',
    });
    expect(entryUpserts).toHaveLength(2);
    expect(imageUpserts).toHaveLength(1);
    expect(attemptInserts).toEqual([
      {
        entryId: syncSessionPayloadFixture.entries[0].id,
        sequenceOrder: 0,
      },
      {
        entryId: syncSessionPayloadFixture.entries[0].id,
        sequenceOrder: 1,
      },
    ]);
  });

  it('updates existing climb attempts on retry instead of inserting duplicates', async () => {
    const mock = createMockDb();

    await syncMocks.syncSession(
      mock.db as never,
      'user_123',
      syncSessionPayloadFixture,
    );
    await syncMocks.syncSession(
      mock.db as never,
      'user_123',
      syncSessionPayloadFixture,
    );

    expect(mock.attemptInserts).toHaveLength(4);
    expect(mock.attemptConflictUpdates).toHaveLength(4);
  });

  it('rejects syncing a session owned by another user', async () => {
    const mock = createMockDb({ existingUserId: 'other_user' });

    await expect(
      syncMocks.syncSession(
        mock.db as never,
        'user_123',
        syncSessionPayloadFixture,
      ),
    ).rejects.toBeInstanceOf(SyncSessionForbiddenError);
  });
});

describe('session sync route', () => {
  beforeEach(() => {
    syncMocks.syncSession.mockClear();
  });

  it('returns 401 without an authenticated session', async () => {
    const app = createApiApp({
      createAuthServer: () => ({
        handler: () => new Response(null),
        api: {
          getSession: vi.fn().mockResolvedValue(null),
        },
      }),
    });

    const response = await app.request('/api/sessions/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(syncSessionPayloadFixture),
    });

    expect(response.status).toBe(401);
    expect(syncMocks.syncSession).not.toHaveBeenCalled();
  });
});
