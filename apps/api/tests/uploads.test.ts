import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MAX_IMAGE_UPLOAD_BYTES } from '@boulder/api-contract';
import type { AuthEnvBindings } from '@boulder/auth';
import { createApiApp } from '../src/index.js';
import type * as CreatePresignedUploadModule from '../src/uploads/create-presigned-upload.js';
import {
  buildPhotoUrl,
  buildUploadObjectKey,
} from '../src/uploads/object-key.js';
import type * as R2PresignModule from '../src/uploads/r2-presign.js';

const uploadMocks = vi.hoisted(() => ({
  createPresignedUpload: vi.fn(),
  createR2PresignedPutUrl: vi.fn(),
  restoreImplementations: () => {
    /* empty */
  },
}));

vi.mock(
  import('../src/uploads/create-presigned-upload.js'),
  async (importOriginal) => {
    const actual = await importOriginal<typeof CreatePresignedUploadModule>();
    const restore = () => {
      uploadMocks.createPresignedUpload.mockImplementation(
        actual.createPresignedUpload,
      );
    };
    uploadMocks.restoreImplementations = restore;
    restore();
    return {
      createPresignedUpload: uploadMocks.createPresignedUpload,
    };
  },
);

vi.mock(import('../src/uploads/r2-presign.js'), async (importOriginal) => {
  const actual = await importOriginal<typeof R2PresignModule>();
  return {
    ...actual,
    createR2PresignedPutUrl: uploadMocks.createR2PresignedPutUrl,
  };
});

const sessionId = '987fcdeb-51a2-43d7-9012-345678901234';
const entryId = '123e4567-e89b-12d3-a456-426614174000';
const imageId = '223e4567-e89b-12d3-a456-426614174001';

const presignedUploadRequest = {
  sessionId,
  entryId,
  imageId,
  index: 0,
  contentType: 'image/webp' as const,
  contentLength: 512_000,
};

const authEnv = {
  BETTER_AUTH_SECRET: 'x'.repeat(32),
  BETTER_AUTH_URL: 'http://localhost:8787',
  FRONTEND_URL: 'http://localhost:5173',
  DATABASE_URL: 'postgresql://user:pass@host/db',
  PUBLIC_PHOTO_URL_BASE: 'https://cdn.example.com',
  R2_ACCOUNT_ID: 'test-account-id',
  R2_BUCKET_NAME: 'boulder-dot-best',
  R2_ACCESS_KEY_ID: 'test-access-key',
  R2_SECRET_ACCESS_KEY: 'test-secret-key',
} satisfies AuthEnvBindings & {
  PUBLIC_PHOTO_URL_BASE: string;
  R2_ACCOUNT_ID: string;
  R2_BUCKET_NAME: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
};

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

describe('upload object keys', () => {
  it('builds userId/sessionId/entryId/timestamp-index.ext from MIME type', () => {
    expect(
      buildUploadObjectKey({
        userId: 'user_123',
        sessionId,
        entryId,
        index: 1,
        contentType: 'image/jpeg',
        timestampMs: 1_715_600_000_000,
      }),
    ).toBe(
      'user_123/987fcdeb-51a2-43d7-9012-345678901234/123e4567-e89b-12d3-a456-426614174000/1715600000000-1.jpeg',
    );
  });

  it('builds stable photo URLs from the configured public base', () => {
    const objectKey =
      'user_123/987fcdeb-51a2-43d7-9012-345678901234/123e4567-e89b-12d3-a456-426614174000/1715600000000-0.webp';

    expect(buildPhotoUrl('https://cdn.example.com/', objectKey)).toBe(
      `https://cdn.example.com/${objectKey}`,
    );
  });
});

describe('createPresignedUpload', () => {
  beforeEach(() => {
    uploadMocks.restoreImplementations();
    uploadMocks.createR2PresignedPutUrl.mockReset();
    uploadMocks.createR2PresignedPutUrl.mockResolvedValue(
      'https://acc.r2.cloudflarestorage.com/bucket/key?X-Amz-Signature=abc',
    );
  });

  it('returns upload URL, object key, photo URL, and image metadata', async () => {
    const { createPresignedUpload } =
      await import('../src/uploads/create-presigned-upload.js');

    const response = await createPresignedUpload({
      userId: 'user_123',
      body: presignedUploadRequest,
      photoUrlBase: 'https://cdn.example.com',
      r2: {
        accountId: authEnv.R2_ACCOUNT_ID,
        bucketName: authEnv.R2_BUCKET_NAME,
        accessKeyId: authEnv.R2_ACCESS_KEY_ID,
        secretAccessKey: authEnv.R2_SECRET_ACCESS_KEY,
      },
      now: () => 1_715_600_000_000,
    });

    expect(response.uploadUrl).toContain('r2.cloudflarestorage.com');
    expect(response.uploadUrl).not.toContain('cdn.example.com');
    expect(response.objectKey).toBe(
      'user_123/987fcdeb-51a2-43d7-9012-345678901234/123e4567-e89b-12d3-a456-426614174000/1715600000000-0.webp',
    );
    expect(response.photoUrl).toBe(
      'https://cdn.example.com/user_123/987fcdeb-51a2-43d7-9012-345678901234/123e4567-e89b-12d3-a456-426614174000/1715600000000-0.webp',
    );
    expect(response.image).toEqual({
      id: imageId,
      index: 0,
      objectKey: response.objectKey,
      photoUrl: response.photoUrl,
      contentType: 'image/webp',
      contentLength: 512_000,
    });
    expect(uploadMocks.createR2PresignedPutUrl).toHaveBeenCalledWith({
      config: {
        accountId: authEnv.R2_ACCOUNT_ID,
        bucketName: authEnv.R2_BUCKET_NAME,
        accessKeyId: authEnv.R2_ACCESS_KEY_ID,
        secretAccessKey: authEnv.R2_SECRET_ACCESS_KEY,
      },
      objectKey: response.objectKey,
      contentType: 'image/webp',
    });
  });
});

describe('presigned upload routes', () => {
  beforeEach(() => {
    uploadMocks.createPresignedUpload.mockReset();
    uploadMocks.restoreImplementations();
  });

  afterEach(() => {
    uploadMocks.restoreImplementations();
  });

  it('returns 401 without an authenticated session', async () => {
    const app = createAuthedApp(null);
    const response = await app.request('/api/uploads/presigned-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(presignedUploadRequest),
    });

    expect(response.status).toBe(401);
    expect(uploadMocks.createPresignedUpload).not.toHaveBeenCalled();
  });

  it('rejects uploads over 30 MB before the handler runs', async () => {
    const app = createAuthedApp('user_123');
    const response = await app.request(
      '/api/uploads/presigned-url',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...presignedUploadRequest,
          contentLength: MAX_IMAGE_UPLOAD_BYTES + 1,
        }),
      },
      authEnv,
    );

    expect(response.status).toBe(400);
    expect(uploadMocks.createPresignedUpload).not.toHaveBeenCalled();
  });

  it('returns presigned upload metadata for authenticated users', async () => {
    const expected = {
      uploadUrl:
        'https://acc.r2.cloudflarestorage.com/boulder-dot-best/key?X-Amz-Signature=abc',
      objectKey:
        'user_123/987fcdeb-51a2-43d7-9012-345678901234/123e4567-e89b-12d3-a456-426614174000/1715600000000-0.webp',
      photoUrl:
        'https://cdn.example.com/user_123/987fcdeb-51a2-43d7-9012-345678901234/123e4567-e89b-12d3-a456-426614174000/1715600000000-0.webp',
      image: {
        id: imageId,
        index: 0,
        objectKey:
          'user_123/987fcdeb-51a2-43d7-9012-345678901234/123e4567-e89b-12d3-a456-426614174000/1715600000000-0.webp',
        photoUrl:
          'https://cdn.example.com/user_123/987fcdeb-51a2-43d7-9012-345678901234/123e4567-e89b-12d3-a456-426614174000/1715600000000-0.webp',
        contentType: 'image/webp' as const,
        contentLength: 512_000,
      },
    };
    uploadMocks.createPresignedUpload.mockResolvedValue(expected);

    const app = createAuthedApp('user_123');
    const response = await app.request(
      '/api/uploads/presigned-url',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(presignedUploadRequest),
      },
      authEnv,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(expected);
    expect(uploadMocks.createPresignedUpload).toHaveBeenCalledWith({
      userId: 'user_123',
      body: presignedUploadRequest,
      photoUrlBase: authEnv.PUBLIC_PHOTO_URL_BASE,
      r2: {
        accountId: authEnv.R2_ACCOUNT_ID,
        bucketName: authEnv.R2_BUCKET_NAME,
        accessKeyId: authEnv.R2_ACCESS_KEY_ID,
        secretAccessKey: authEnv.R2_SECRET_ACCESS_KEY,
      },
    });
  });
});
