import { assert, describe, expect, it } from 'vitest';
import {
  MAX_IMAGE_UPLOAD_BYTES,
  MAX_IMAGE_UPLOAD_ERROR,
} from '../src/constants.js';
import {
  gymSchema,
  gymsResponseSchema,
  presignedUploadRequestSchema,
  presignedUploadResponseSchema,
  sessionDetailResponseSchema,
  sessionHistoryListQuerySchema,
  sessionHistoryListResponseSchema,
  syncSessionPayloadSchema,
  syncedImageSchema,
} from '../src/schemas.js';
import {
  gymFixture,
  maxUploadContentLength,
  presignedUploadRequestFixture,
  presignedUploadResponseFixture,
  sessionDetailResponseFixture,
  sessionHistoryListResponseFixture,
  syncSessionPayloadFixture,
  syncedImageFixture,
} from './fixtures.js';

describe(syncedImageSchema, () => {
  it('accepts valid image metadata', () => {
    expect(syncedImageSchema.safeParse(syncedImageFixture).success).toBe(true);
  });

  it('rejects invalid content type and non-positive content length', () => {
    expect(
      syncedImageSchema.safeParse({
        ...syncedImageFixture,
        contentType: 'image/gif',
      }).success,
    ).toBe(false);

    expect(
      syncedImageSchema.safeParse({
        ...syncedImageFixture,
        contentLength: 0,
      }).success,
    ).toBe(false);
  });
});

describe(gymsResponseSchema, () => {
  it('accepts a list of gyms', () => {
    expect(gymsResponseSchema.safeParse([gymFixture]).success).toBe(true);
  });

  it('rejects gyms with invalid ids or empty names', () => {
    expect(
      gymsResponseSchema.safeParse([
        {
          ...gymFixture,
          id: 'not-a-uuid',
        },
      ]).success,
    ).toBe(false);

    expect(
      gymSchema.safeParse({
        ...gymFixture,
        name: '',
      }).success,
    ).toBe(false);
  });
});

describe(presignedUploadRequestSchema, () => {
  it('accepts a valid presign request at the size limit', () => {
    expect(
      presignedUploadRequestSchema.safeParse({
        ...presignedUploadRequestFixture,
        contentLength: maxUploadContentLength,
      }).success,
    ).toBe(true);
  });

  it('rejects uploads over 30 MB with the correct message', () => {
    const result = presignedUploadRequestSchema.safeParse({
      ...presignedUploadRequestFixture,
      contentLength: maxUploadContentLength + 1,
    });

    assert(!result.success);
    expect(result.error.issues[0]?.message).toBe(MAX_IMAGE_UPLOAD_ERROR);
  });

  it('rejects missing session linkage fields and invalid mime types', () => {
    expect(
      presignedUploadRequestSchema.safeParse({
        entryId: presignedUploadRequestFixture.entryId,
        imageId: presignedUploadRequestFixture.imageId,
        index: 0,
        contentType: 'image/webp',
        contentLength: 1,
      }).success,
    ).toBe(false);

    expect(
      presignedUploadRequestSchema.safeParse({
        ...presignedUploadRequestFixture,
        contentType: 'application/pdf',
      }).success,
    ).toBe(false);
  });
});

describe(presignedUploadResponseSchema, () => {
  it('accepts upload URL, object key, photo URL, and nested image metadata', () => {
    expect(
      presignedUploadResponseSchema.safeParse(presignedUploadResponseFixture)
        .success,
    ).toBe(true);
  });
});

describe(syncSessionPayloadSchema, () => {
  it('accepts a valid sync payload with multiple climb images', () => {
    const result = syncSessionPayloadSchema.safeParse(
      syncSessionPayloadFixture,
    );
    expect(result.success).toBe(true);
  });

  it('rejects invalid session ids, timestamps, and negative durations', () => {
    expect(
      syncSessionPayloadSchema.safeParse({
        ...syncSessionPayloadFixture,
        id: 'bad-id',
      }).success,
    ).toBe(false);

    expect(
      syncSessionPayloadSchema.safeParse({
        ...syncSessionPayloadFixture,
        startTime: 'yesterday',
      }).success,
    ).toBe(false);

    expect(
      syncSessionPayloadSchema.safeParse({
        ...syncSessionPayloadFixture,
        entries: [
          {
            ...syncSessionPayloadFixture.entries[0],
            durationMs: -1,
          },
          syncSessionPayloadFixture.entries[1],
        ],
      }).success,
    ).toBe(false);
  });

  it('rejects climb rows missing the discriminant or images array', () => {
    expect(
      syncSessionPayloadSchema.safeParse({
        ...syncSessionPayloadFixture,
        entries: [
          {
            id: syncSessionPayloadFixture.entries[0].id,
            sequenceOrder: 0,
            durationMs: 1000,
            name: 'Missing type',
            grade: null,
            attempts: null,
            completed: null,
            images: [],
          },
          syncSessionPayloadFixture.entries[1],
        ],
      }).success,
    ).toBe(false);

    expect(
      syncSessionPayloadSchema.safeParse({
        ...syncSessionPayloadFixture,
        entries: [
          {
            ...syncSessionPayloadFixture.entries[0],
            images: undefined,
          },
          syncSessionPayloadFixture.entries[1],
        ],
      }).success,
    ).toBe(false);
  });

  it('rejects break rows that include climb-only fields', () => {
    expect(
      syncSessionPayloadSchema.safeParse({
        ...syncSessionPayloadFixture,
        entries: [
          {
            ...syncSessionPayloadFixture.entries[1],
            images: [],
          },
        ],
      }).success,
    ).toBe(false);
  });
});

describe(sessionHistoryListQuerySchema, () => {
  it('defaults limit to 20 and accepts cursor pagination input', () => {
    expect(sessionHistoryListQuerySchema.parse({})).toEqual({ limit: 20 });

    expect(
      sessionHistoryListQuerySchema.safeParse({
        limit: '10',
        cursor: '2026-05-13T10:00:00.000Z',
      }).success,
    ).toBe(true);
  });

  it('rejects limits outside 1-50 and invalid cursors', () => {
    expect(sessionHistoryListQuerySchema.safeParse({ limit: 0 }).success).toBe(
      false,
    );
    expect(sessionHistoryListQuerySchema.safeParse({ limit: 51 }).success).toBe(
      false,
    );
    expect(
      sessionHistoryListQuerySchema.safeParse({ cursor: 'not-a-datetime' })
        .success,
    ).toBe(false);
  });
});

describe(sessionHistoryListResponseSchema, () => {
  it('accepts paginated history list items', () => {
    expect(
      sessionHistoryListResponseSchema.safeParse(
        sessionHistoryListResponseFixture,
      ).success,
    ).toBe(true);
  });

  it('rejects list items missing gymName or endTime', () => {
    expect(
      sessionHistoryListResponseSchema.safeParse({
        items: [
          {
            ...sessionHistoryListResponseFixture.items[0],
            gymName: '',
          },
        ],
        nextCursor: null,
      }).success,
    ).toBe(false);
  });
});

describe(sessionDetailResponseSchema, () => {
  it('accepts session detail with ordered climb images metadata', () => {
    expect(
      sessionDetailResponseSchema.safeParse(sessionDetailResponseFixture)
        .success,
    ).toBe(true);
  });

  it('rejects detail payloads with unsorted-type invalid entries', () => {
    expect(
      sessionDetailResponseSchema.safeParse({
        ...sessionDetailResponseFixture,
        entries: [
          {
            id: sessionDetailResponseFixture.entries[0].id,
            sequenceOrder: 0,
            durationMs: 1000,
            type: 'climb',
            name: null,
            grade: null,
            attempts: null,
            completed: null,
          },
        ],
      }).success,
    ).toBe(false);
  });
});

describe('image upload limit constant', () => {
  it('matches the 30 MB MVP limit', () => {
    expect(MAX_IMAGE_UPLOAD_BYTES).toBe(30 * 1024 * 1024);
  });
});
