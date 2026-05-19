import { describe, expect, it } from 'vitest';
import type { SyncSessionPayload } from '@boulder/api-contract';
import {
  attachSyncedImagesToPayload,
  mapFileToOfflineImage,
} from '../../src/offline/index.js';

const sessionId = '987fcdeb-51a2-43d7-9012-345678901234';
const climbEntryId = '123e4567-e89b-12d3-a456-426614174000';
const breakEntryId = '423e4567-e89b-12d3-a456-426614174003';

const payloadFixture = (): SyncSessionPayload => ({
  id: sessionId,
  gymId: 'a1b2c3d4-e5f6-4789-a234-56789abcdef0',
  startTime: '2026-05-13T10:00:00.000Z',
  endTime: '2026-05-13T12:00:00.000Z',
  totalDurationMs: 7_200_000,
  entries: [
    {
      id: climbEntryId,
      sequenceOrder: 0,
      type: 'climb',
      name: 'Pink corner',
      grade: 'V3',
      completed: true,
      durationMs: 45_000,
      climbAttempts: [],
      images: [],
    },
    {
      id: breakEntryId,
      sequenceOrder: 1,
      type: 'break',
      durationMs: 300_000,
    },
  ],
});

describe('attach synced images to payload', () => {
  it('groups uploaded images onto climb entries by entry id', () => {
    const first = {
      ...mapFileToOfflineImage({
        file: new File(['one'], 'one.jpg', { type: 'image/jpeg' }),
        sessionId,
        entryId: climbEntryId,
        index: 1,
        imageId: '22222222-2222-4222-8222-222222222222',
      }),
      uploadStatus: 'uploaded' as const,
      objectKey: 'user/session/entry/1.webp',
      photoUrl: 'https://cdn.example.com/1.webp',
      uploadedAt: Date.now(),
    };
    const second = {
      ...mapFileToOfflineImage({
        file: new File(['two'], 'two.jpg', { type: 'image/jpeg' }),
        sessionId,
        entryId: climbEntryId,
        index: 0,
        imageId: '11111111-1111-4111-8111-111111111111',
      }),
      uploadStatus: 'uploaded' as const,
      objectKey: 'user/session/entry/0.webp',
      photoUrl: 'https://cdn.example.com/0.webp',
      uploadedAt: Date.now(),
    };

    const payload = attachSyncedImagesToPayload(payloadFixture(), [
      first,
      second,
    ]);

    expect(payload.entries[0]).toMatchObject({
      type: 'climb',
      images: [
        expect.objectContaining({ id: second.id, index: 0 }),
        expect.objectContaining({ id: first.id, index: 1 }),
      ],
    });
    expect(payload.entries[1]).toEqual(payloadFixture().entries[1]);
  });
});
