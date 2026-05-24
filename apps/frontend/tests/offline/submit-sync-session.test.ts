import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SyncClimbEntry, SyncSessionPayload } from '@boulder/api-contract';
import type * as apiClientModule from '../../src/lib/api-client.js';
import { submitSyncSession } from '../../src/offline/index.js';

const sessionSyncPost = vi.hoisted(() => vi.fn());

vi.mock(
  import('../../src/lib/api-client.js'),
  () =>
    ({
      apiClient: {
        api: {
          sessions: {
            sync: {
              $post: sessionSyncPost,
            },
          },
        },
      },
    }) as unknown as typeof apiClientModule,
);

const climbEntryFixture = (): SyncClimbEntry => ({
  id: '123e4567-e89b-12d3-a456-426614174000',
  sequenceOrder: 0,
  type: 'climb',
  name: 'Pink corner',
  grade: 'V3',
  notes: '',
  durationMs: 45_000,
  climbAttempts: [],
  images: [],
});

const payloadFixture = (): SyncSessionPayload => ({
  id: '987fcdeb-51a2-43d7-9012-345678901234',
  gymId: 'a1b2c3d4-e5f6-4789-a234-56789abcdef0',
  startTime: '2026-05-13T10:00:00.000Z',
  endTime: '2026-05-13T12:00:00.000Z',
  totalDurationMs: 7_200_000,
  notes: '',
  entries: [climbEntryFixture()],
});

describe('submit sync session', () => {
  beforeEach(() => {
    sessionSyncPost.mockReset();
  });

  it('posts the payload with attached synced images', async () => {
    sessionSyncPost.mockResolvedValue({ ok: true });

    await submitSyncSession(payloadFixture(), [
      {
        id: '223e4567-e89b-12d3-a456-426614174001',
        sessionId: payloadFixture().id,
        entryId: '123e4567-e89b-12d3-a456-426614174000',
        index: 0,
        contentType: 'image/jpeg',
        contentLength: 128,
        blob: new Blob(['pixels']),
        createdAt: Date.now(),
        uploadStatus: 'uploaded',
        objectKey: 'user/session/entry/0.jpeg',
        photoUrl: 'https://cdn.example.com/0.jpeg',
        uploadedAt: Date.now(),
      },
    ]);

    expect(sessionSyncPost).toHaveBeenCalledWith({
      json: expect.objectContaining({
        entries: [
          expect.objectContaining({
            images: [
              expect.objectContaining({
                photoUrl: 'https://cdn.example.com/0.jpeg',
              }),
            ],
          }),
        ],
      }),
    });
  });

  it('throws when the API rejects the payload', async () => {
    sessionSyncPost.mockResolvedValue({ ok: false, status: 500 });

    await expect(submitSyncSession(payloadFixture(), [])).rejects.toThrow(
      'Session sync failed (500)',
    );
  });

  it('rounds fractional duration fields before posting', async () => {
    sessionSyncPost.mockResolvedValue({ ok: true });

    await submitSyncSession(
      {
        ...payloadFixture(),
        totalDurationMs: 30_295.439_941,
        entries: [
          {
            ...climbEntryFixture(),
            durationMs: 8587.735_107,
            climbAttempts: [
              {
                sequenceOrder: 0,
                durationMs: 8587.735_107,
                completed: true,
                notes: '',
              },
            ],
          },
        ],
      },
      [],
    );

    expect(sessionSyncPost).toHaveBeenCalledWith({
      json: expect.objectContaining({
        totalDurationMs: 30_295,
        entries: [
          expect.objectContaining({
            durationMs: 8588,
            climbAttempts: [expect.objectContaining({ durationMs: 8588 })],
          }),
        ],
      }),
    });
  });

  it('normalizes Temporal nanosecond timestamps to millisecond ISO strings', async () => {
    sessionSyncPost.mockResolvedValue({ ok: true });

    await submitSyncSession(
      {
        ...payloadFixture(),
        startTime: '2026-05-22T14:24:22.138850098Z',
        endTime: '2026-05-22T14:24:23.571850098Z',
        entries: [],
      },
      [],
    );

    expect(sessionSyncPost).toHaveBeenCalledWith({
      json: expect.objectContaining({
        startTime: '2026-05-22T14:24:22.138Z',
        endTime: '2026-05-22T14:24:23.571Z',
      }),
    });
  });
});
