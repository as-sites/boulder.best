import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthEnvBindings } from '@boulder/auth';
import { getTableName } from 'drizzle-orm';
import type { AppDb } from '../src/db/index.js';
import { createApiApp } from '../src/index.js';
import type * as SyncSessionModule from '../src/sessions/sync-session.js';
import {
  SyncSessionConflictError,
  SyncSessionDuplicateSequenceOrderError,
  SyncSessionForbiddenError,
  SyncSessionInvalidLocationError,
  SyncSessionInvalidTimeRangeError,
} from '../src/sessions/sync-session.js';

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

const gymId = 'a1b2c3d4-e5f6-4789-a234-56789abcdef0';
const apiEnv = {
  GYMS_RATE_LIMITER: {
    limit: vi.fn().mockResolvedValue({ success: true }),
  },
  BETTER_AUTH_SECRET: 'x'.repeat(32),
  BETTER_AUTH_URL: 'http://localhost:8787',
  FRONTEND_URL: 'http://localhost:5173',
  DATABASE_URL: 'postgresql://user:pass@host/db',
} satisfies AuthEnvBindings & {
  GYMS_RATE_LIMITER: {
    limit: (options: { key: string }) => Promise<{ success: boolean }>;
  };
};

const syncSessionPayloadFixture = {
  id: '987fcdeb-51a2-43d7-9012-345678901234',
  gymId,
  location: 'Main Wall',
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
      notes: '',
      climbAttempts: [
        {
          sequenceOrder: 0,
          durationMs: 20_000,
          completed: false,
          notes: 'Slipped on crux',
        },
        { sequenceOrder: 1, durationMs: 25_000, completed: true, notes: '' },
      ],
      images: [
        {
          id: '223e4567-e89b-12d3-a456-426614174001',
          index: 0,
          objectKey:
            'user_123/987fcdeb-51a2-43d7-9012-345678901234/123e4567-e89b-12d3-a456-426614174000/1715600000000-0.webp',
          photoUrl:
            'https://cdn.example.com/user_123/987fcdeb-51a2-43d7-9012-345678901234/123e4567-e89b-12d3-a456-426614174000/1715600000000-0.webp',
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

const createMockDb = (
  options: {
    existingUserId?: string;
    gymLocations?: string[];
    conflictingEntryIds?: string[];
    conflictingImageIds?: string[];
  } = {},
) => {
  const sessionUpserts: unknown[] = [];
  const entryUpserts: unknown[] = [];
  const imageUpserts: unknown[] = [];
  const attemptInserts: Array<{ entryId: string; sequenceOrder: number }> = [];
  const attemptConflictUpdates: unknown[] = [];
  const deletedEntryIds: string[][] = [];

  const tx = {
    select: vi.fn(() => ({
      from: vi.fn((table: Parameters<typeof getTableName>[0]) => ({
        where: vi.fn(() => ({
          // oxlint-disable-next-line typescript/require-await
          limit: vi.fn(async () => {
            const tableName = getTableName(table);

            if (tableName === 'sessions') {
              return options.existingUserId
                ? [{ userId: options.existingUserId }]
                : [];
            }

            if (tableName === 'gyms') {
              return [{ locations: options.gymLocations ?? ['Main Wall'] }];
            }

            if (tableName === 'session_entries') {
              const conflictingId = options.conflictingEntryIds?.[0];
              return conflictingId ? [{ id: conflictingId }] : [];
            }

            if (tableName === 'session_entry_images') {
              const conflictingId = options.conflictingImageIds?.[0];
              return conflictingId ? [{ id: conflictingId }] : [];
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
          // oxlint-disable-next-line typescript/require-await
          onConflictDoUpdate: vi.fn(async (update) => {
            if (tableName === 'climb_attempts') {
              attemptConflictUpdates.push(update);
            }
          }),
        };
      }),
    })),
    delete: vi.fn(() => ({
      where: vi.fn((condition: unknown) => {
        deletedEntryIds.push(condition as string[]);
      }),
    })),
  };

  const db = {
    ...tx,
    batch: vi.fn(async (_operations: unknown[]) => {
      /* empty */
    }),
  };

  return {
    db,
    sessionUpserts,
    entryUpserts,
    imageUpserts,
    attemptInserts,
    attemptConflictUpdates,
    deletedEntryIds,
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
      location: 'Main Wall',
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

  it('deletes entries listed in deletedEntryIds after upserts on re-sync', async () => {
    const removedEntryId = syncSessionPayloadFixture.entries[1].id;
    const mock = createMockDb();

    await syncMocks.syncSession(
      mock.db as never,
      'user_123',
      syncSessionPayloadFixture,
    );
    await syncMocks.syncSession(mock.db as never, 'user_123', {
      ...syncSessionPayloadFixture,
      entries: [syncSessionPayloadFixture.entries[0]],
      deletedEntryIds: [removedEntryId],
    });

    expect(mock.entryUpserts).toHaveLength(3);
    expect(mock.deletedEntryIds).toHaveLength(1);
  });

  it('does not delete entry ids that are still present in entries', async () => {
    const mock = createMockDb();

    await syncMocks.syncSession(mock.db as never, 'user_123', {
      ...syncSessionPayloadFixture,
      deletedEntryIds: [syncSessionPayloadFixture.entries[0].id],
    });

    expect(mock.deletedEntryIds).toHaveLength(0);
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

  it('rejects sessions where endTime is before startTime', async () => {
    const mock = createMockDb();

    await expect(
      syncMocks.syncSession(mock.db as never, 'user_123', {
        ...syncSessionPayloadFixture,
        startTime: '2026-05-13T12:00:00.000Z',
        endTime: '2026-05-13T10:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(SyncSessionInvalidTimeRangeError);

    expect(mock.sessionUpserts).toHaveLength(0);
  });

  it('rejects invalid locations for the selected gym', async () => {
    const mock = createMockDb({ gymLocations: ['Annex'] });

    await expect(
      syncMocks.syncSession(
        mock.db as never,
        'user_123',
        syncSessionPayloadFixture,
      ),
    ).rejects.toBeInstanceOf(SyncSessionInvalidLocationError);
  });

  it('rejects duplicate sequenceOrder values in session entries', async () => {
    const mock = createMockDb();

    await expect(
      syncMocks.syncSession(mock.db as never, 'user_123', {
        ...syncSessionPayloadFixture,
        entries: [
          syncSessionPayloadFixture.entries[0],
          {
            ...syncSessionPayloadFixture.entries[1],
            sequenceOrder: syncSessionPayloadFixture.entries[0].sequenceOrder,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(SyncSessionDuplicateSequenceOrderError);

    expect(mock.sessionUpserts).toHaveLength(0);
  });

  it('accepts null location when the gym has catalog locations', async () => {
    const mock = createMockDb();

    await syncMocks.syncSession(mock.db as never, 'user_123', {
      ...syncSessionPayloadFixture,
      location: null,
    });

    expect(mock.sessionUpserts[0]).toMatchObject({ location: null });
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

  it('rejects entry ids that already belong to another user', async () => {
    const mock = createMockDb({
      conflictingEntryIds: [syncSessionPayloadFixture.entries[0].id],
    });

    await expect(
      syncMocks.syncSession(
        mock.db as never,
        'user_123',
        syncSessionPayloadFixture,
      ),
    ).rejects.toBeInstanceOf(SyncSessionConflictError);

    expect(mock.sessionUpserts).toHaveLength(0);
  });

  it('rejects image ids that already belong to another session', async () => {
    const mock = createMockDb({
      conflictingImageIds: [syncSessionPayloadFixture.entries[0].images[0].id],
    });

    await expect(
      syncMocks.syncSession(
        mock.db as never,
        'user_123',
        syncSessionPayloadFixture,
      ),
    ).rejects.toBeInstanceOf(SyncSessionConflictError);

    expect(mock.sessionUpserts).toHaveLength(0);
  });

  it('rejects image metadata with an unexpected object key', async () => {
    const mock = createMockDb();

    await expect(
      syncMocks.syncSession(mock.db as never, 'user_123', {
        ...syncSessionPayloadFixture,
        entries: [
          {
            ...syncSessionPayloadFixture.entries[0],
            images: [
              {
                ...syncSessionPayloadFixture.entries[0].images[0],
                objectKey: 'other-user/other-session/other-entry/1-0.webp',
              },
            ],
          },
          syncSessionPayloadFixture.entries[1],
        ],
      }),
    ).rejects.toMatchObject({ name: 'SyncSessionInvalidImageMetadataError' });
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

  it('returns 400 when sync payload has duplicate sequenceOrder values', async () => {
    syncMocks.syncSession.mockRejectedValueOnce(
      new SyncSessionDuplicateSequenceOrderError(),
    );

    const app = createApiApp({
      createAuthServer: () => ({
        handler: () => new Response(null),
        api: {
          getSession: vi.fn().mockResolvedValue({
            user: { id: 'user_123' },
            session: { id: 'auth_session' },
          }),
        },
      }),
    });

    const response = await app.request(
      '/api/sessions/sync',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(syncSessionPayloadFixture),
      },
      apiEnv,
    );

    expect(response.status).toBe(400);
  });
});
