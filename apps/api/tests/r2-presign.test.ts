import { beforeEach, describe, expect, it, vi } from 'vitest';
import type s3miniModule from 's3mini';

const { getPresignedUrl } = vi.hoisted(() => ({
  getPresignedUrl: vi.fn(),
}));

vi.mock(import('s3mini'), () => {
  class MockS3mini {
    public getPresignedUrl = getPresignedUrl;
  }
  return {
    S3mini: MockS3mini,
    default: MockS3mini,
  } as unknown as s3miniModule;
});

describe('createR2PresignedPutUrl', () => {
  beforeEach(() => {
    getPresignedUrl.mockReset();
    getPresignedUrl.mockResolvedValue(
      'https://acc.r2.cloudflarestorage.com/boulder-dot-best/key?X-Amz-SignedHeaders=host',
    );
  });

  it('uses virtual-hosted R2 endpoint and UNSIGNED-PAYLOAD query param', async () => {
    const { buildR2S3Endpoint, createR2PresignedPutUrl } =
      await import('../src/uploads/r2-presign.js');

    expect(
      buildR2S3Endpoint({
        accountId: 'acc',
        bucketName: 'boulder-dot-best',
        accessKeyId: 'key',
        secretAccessKey: 'secret',
      }),
    ).toBe('https://boulder-dot-best.acc.r2.cloudflarestorage.com');

    await createR2PresignedPutUrl({
      config: {
        accountId: 'acc',
        bucketName: 'boulder-dot-best',
        accessKeyId: 'key',
        secretAccessKey: 'secret',
      },
      objectKey: 'user/session/entry/1-0.png',
      contentType: 'image/png',
    });

    expect(getPresignedUrl).toHaveBeenCalledWith(
      'PUT',
      'user/session/entry/1-0.png',
      3600,
      { 'X-Amz-Content-Sha256': 'UNSIGNED-PAYLOAD' },
    );
  });
});
