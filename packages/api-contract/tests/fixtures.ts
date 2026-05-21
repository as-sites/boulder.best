import { MAX_IMAGE_UPLOAD_BYTES } from '../src/constants.js';
import type { SyncedImage } from '../src/schemas.js';

export const sessionId = '987fcdeb-51a2-43d7-9012-345678901234';
export const gymId = 'a1b2c3d4-e5f6-4789-a234-56789abcdef0';
export const entryId = '123e4567-e89b-12d3-a456-426614174000';
export const imageId = '223e4567-e89b-12d3-a456-426614174001';

export const syncedImageFixture: SyncedImage = {
  id: imageId,
  index: 0,
  objectKey: 'user-id/session-id/entry-id/1715600000000-0.webp',
  photoUrl:
    'https://cdn.example.com/user-id/session-id/entry-id/1715600000000-0.webp',
  contentType: 'image/webp',
  contentLength: 512_000,
};

export const syncedImageFixtureTwo: SyncedImage = {
  id: '323e4567-e89b-12d3-a456-426614174002',
  index: 1,
  objectKey: 'user-id/session-id/entry-id/1715600000001-1.jpeg',
  photoUrl:
    'https://cdn.example.com/user-id/session-id/entry-id/1715600000001-1.jpeg',
  contentType: 'image/jpeg',
  contentLength: 256_000,
};

export const gymFixture = {
  id: gymId,
  name: 'Boulder Central',
  grades: ['V0', 'V1', 'V2', 'V3'],
  locations: ['Main Wall'],
  updatedAt: '2026-05-13T08:00:00.000Z',
} as const;

export const syncSessionPayloadFixture = {
  id: sessionId,
  gymId,
  location: 'Main Wall',
  startTime: '2026-05-13T10:00:00.000Z',
  endTime: '2026-05-13T12:00:00.000Z',
  totalDurationMs: 7_200_000,
  notes: 'Felt strong today.',
  entries: [
    {
      id: entryId,
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
      images: [syncedImageFixture, syncedImageFixtureTwo],
    },
    {
      id: '423e4567-e89b-12d3-a456-426614174003',
      sequenceOrder: 1,
      durationMs: 300_000,
      type: 'break' as const,
    },
  ],
} as const;

export const presignedUploadRequestFixture = {
  sessionId,
  entryId,
  imageId,
  index: 0,
  contentType: 'image/webp' as const,
  contentLength: 512_000,
};

export const presignedUploadResponseFixture = {
  uploadUrl: 'https://r2.example.com/upload?signature=abc',
  objectKey: syncedImageFixture.objectKey,
  photoUrl: syncedImageFixture.photoUrl,
  image: syncedImageFixture,
};

export const sessionHistoryListItemFixture = {
  id: sessionId,
  gymId,
  gymName: 'Boulder Central',
  location: 'Main Wall',
  startTime: '2026-05-13T10:00:00.000Z',
  endTime: '2026-05-13T12:00:00.000Z',
  totalDurationMs: 7_200_000,
  entryCount: 2,
} as const;

export const sessionHistoryListResponseFixture = {
  items: [sessionHistoryListItemFixture],
  nextCursor: null,
} as const;

export const sessionDetailResponseFixture = {
  id: sessionId,
  gymId,
  gymName: 'Boulder Central',
  location: 'Main Wall',
  startTime: '2026-05-13T10:00:00.000Z',
  endTime: '2026-05-13T12:00:00.000Z',
  totalDurationMs: 7_200_000,
  notes: 'Felt strong today.',
  entries: [
    {
      id: syncSessionPayloadFixture.entries[0].id,
      sequenceOrder: syncSessionPayloadFixture.entries[0].sequenceOrder,
      durationMs: syncSessionPayloadFixture.entries[0].durationMs,
      type: 'climb' as const,
      name: syncSessionPayloadFixture.entries[0].name,
      grade: syncSessionPayloadFixture.entries[0].grade,
      attempts: syncSessionPayloadFixture.entries[0].climbAttempts.length,
      completed: syncSessionPayloadFixture.entries[0].completed,
      notes: syncSessionPayloadFixture.entries[0].notes,
      images: syncSessionPayloadFixture.entries[0].images,
    },
    syncSessionPayloadFixture.entries[1],
  ],
};

export const maxUploadContentLength = MAX_IMAGE_UPLOAD_BYTES;
