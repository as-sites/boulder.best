import { setTimeout } from 'node:timers/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as apiClientModule from '../../src/lib/api-client.js';
import {
  mapFileToOfflineImage,
  offlineImagesRepository,
  resetOfflineDatabase,
  uploadOfflineImage,
  uploadOfflineImagesForSession,
} from '../../src/offline/index.js';

const sessionId = '987fcdeb-51a2-43d7-9012-345678901234';
const entryId = '123e4567-e89b-12d3-a456-426614174000';
const imageId = '223e4567-e89b-12d3-a456-426614174001';

const presignedUploadResponseFixture = {
  uploadUrl: 'https://r2.example.com/upload?signature=abc',
  objectKey: 'user-id/session-id/entry-id/1715600000000-0.webp',
  photoUrl:
    'https://cdn.example.com/user-id/session-id/entry-id/1715600000000-0.webp',
  image: {
    id: imageId,
    index: 0,
    objectKey: 'user-id/session-id/entry-id/1715600000000-0.webp',
    photoUrl:
      'https://cdn.example.com/user-id/session-id/entry-id/1715600000000-0.webp',
    contentType: 'image/webp' as const,
    contentLength: 512_000,
  },
};

const { presignPost, fetchMock } = vi.hoisted(() => ({
  presignPost: vi.fn(),
  fetchMock: vi.fn(),
}));

vi.mock(
  import('../../src/lib/api-client.js'),
  () =>
    ({
      apiClient: {
        api: {
          uploads: {
            'presigned-url': {
              $post: presignPost,
            },
          },
        },
      },
    }) as unknown as typeof apiClientModule,
);

vi.stubGlobal('fetch', fetchMock);

describe('upload offline image', () => {
  beforeEach(async () => {
    await resetOfflineDatabase();
    presignPost.mockReset();
    fetchMock.mockReset();
  });

  it('requests a presigned URL and PUTs the blob once', async () => {
    const image = mapFileToOfflineImage({
      file: new File(['pixels'], 'shot.jpg', { type: 'image/jpeg' }),
      sessionId,
      entryId,
      index: 0,
      imageId,
    });
    await offlineImagesRepository.put(image);

    presignPost.mockResolvedValue({
      ok: true,
      // oxlint-disable-next-line typescript/require-await
      json: async () => presignedUploadResponseFixture,
    });
    fetchMock.mockResolvedValue({ ok: true });

    const uploaded = await uploadOfflineImage(image);

    expect(presignPost).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      presignedUploadResponseFixture.uploadUrl,
      expect.objectContaining({
        method: 'PUT',
        body: image.blob,
      }),
    );
    expect(uploaded).toMatchObject({
      uploadStatus: 'uploaded',
      objectKey: presignedUploadResponseFixture.objectKey,
      photoUrl: presignedUploadResponseFixture.photoUrl,
    });
    await expect(offlineImagesRepository.get(image.id)).resolves.toMatchObject({
      uploadStatus: 'uploaded',
    });
  });

  it('skips presign and PUT when upload metadata already exists', async () => {
    const image = mapFileToOfflineImage({
      file: new File(['pixels'], 'shot.jpg', { type: 'image/jpeg' }),
      sessionId,
      entryId,
      index: 0,
      imageId,
    });
    const uploadedImage = {
      ...image,
      uploadStatus: 'uploaded' as const,
      objectKey: presignedUploadResponseFixture.objectKey,
      photoUrl: presignedUploadResponseFixture.photoUrl,
      uploadedAt: Date.now(),
    };
    await offlineImagesRepository.put(uploadedImage);

    await expect(uploadOfflineImage(uploadedImage)).resolves.toEqual(
      uploadedImage,
    );
    expect(presignPost).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws when presign JSON is malformed so the image stays pending', async () => {
    const image = mapFileToOfflineImage({
      file: new File(['pixels'], 'shot.jpg', { type: 'image/jpeg' }),
      sessionId,
      entryId,
      index: 0,
      imageId,
    });
    await offlineImagesRepository.put(image);

    presignPost.mockResolvedValue({
      ok: true,
      // oxlint-disable-next-line typescript/require-await
      json: async () => ({ uploadUrl: 'not-a-url' }),
    });

    await expect(uploadOfflineImage(image)).rejects.toThrow(
      'Presign response failed validation',
    );
    await expect(offlineImagesRepository.get(image.id)).resolves.toMatchObject({
      uploadStatus: 'pending',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws when presign JSON is missing required fields', async () => {
    const image = mapFileToOfflineImage({
      file: new File(['pixels'], 'shot.jpg', { type: 'image/jpeg' }),
      sessionId,
      entryId,
      index: 0,
      imageId,
    });
    await offlineImagesRepository.put(image);

    presignPost.mockResolvedValue({
      ok: true,
      // oxlint-disable-next-line typescript/require-await
      json: async () => ({}),
    });

    await expect(uploadOfflineImage(image)).rejects.toThrow(
      'Presign response failed validation',
    );
  });

  it('uploads session images with bounded concurrency', async () => {
    let inFlight = 0;
    let maxInFlight = 0;

    presignPost.mockImplementation(async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await setTimeout(5);
      inFlight -= 1;
      return {
        ok: true,
        // oxlint-disable-next-line typescript/require-await -- mock matches Response.json shape
        json: async () => presignedUploadResponseFixture,
      };
    });
    fetchMock.mockResolvedValue({ ok: true });

    const imageIds = [
      '33333333-3333-4333-8333-333333333301',
      '33333333-3333-4333-8333-333333333302',
      '33333333-3333-4333-8333-333333333303',
      '33333333-3333-4333-8333-333333333304',
    ] as const;
    const images = imageIds.map((pendingImageId, index) =>
      mapFileToOfflineImage({
        file: new File([`img-${index}`], `img-${index}.jpg`, {
          type: 'image/jpeg',
        }),
        sessionId,
        entryId,
        index,
        imageId: pendingImageId,
      }),
    );
    for (const image of images) {
      await offlineImagesRepository.put(image);
    }

    const uploaded = await uploadOfflineImagesForSession(sessionId);

    expect(uploaded).toHaveLength(4);
    expect(maxInFlight).toBeLessThanOrEqual(3);
    expect(presignPost).toHaveBeenCalledTimes(4);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('uploads every image for a session', async () => {
    const first = mapFileToOfflineImage({
      file: new File(['one'], 'one.jpg', { type: 'image/jpeg' }),
      sessionId,
      entryId,
      index: 0,
      imageId: '11111111-1111-4111-8111-111111111111',
    });
    const second = mapFileToOfflineImage({
      file: new File(['two'], 'two.png', { type: 'image/png' }),
      sessionId,
      entryId,
      index: 1,
      imageId: '22222222-2222-4222-8222-222222222222',
    });
    await offlineImagesRepository.put(first);
    await offlineImagesRepository.put(second);

    presignPost.mockResolvedValue({
      ok: true,
      // oxlint-disable-next-line typescript/require-await
      json: async () => presignedUploadResponseFixture,
    });
    fetchMock.mockResolvedValue({ ok: true });

    const uploaded = await uploadOfflineImagesForSession(sessionId);

    expect(uploaded).toHaveLength(2);
    expect(presignPost).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
