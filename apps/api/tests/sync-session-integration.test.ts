import { env } from 'node:process';
import { describe, expect, it } from 'vitest';
import type { SyncSessionPayload } from '@boulder/api-contract';
import { createDb } from '../src/db/index.js';
import { syncSession } from '../src/sessions/sync-session.js';

const userPayload = {
  id: 'eeb47a41-bfe7-47dd-be18-a72b43c8d022',
  gymId: '900d9e02-0002-4000-8000-000000000002',
  location: 'Alexandria',
  startTime: '2026-05-22T14:24:22.138850098Z',
  endTime: '2026-05-22T14:24:23.571850098Z',
  totalDurationMs: 1433,
  notes: 's',
  entries: [],
  deletedEntryIds: [],
} satisfies SyncSessionPayload;

const databaseUrl = env.DATABASE_URL ?? '';

describe.runIf(databaseUrl.length > 0)('syncSession integration', () => {
  it('persists the user reproduction payload', async () => {
    const db = createDb(databaseUrl);

    const result = await syncSession(db, 'integration-test-user', userPayload);

    expect(result).toEqual({
      success: true,
      sessionId: userPayload.id,
    });
  });
});
