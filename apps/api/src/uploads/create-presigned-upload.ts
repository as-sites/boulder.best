import type {
  PresignedUploadRequest,
  PresignedUploadResponse,
} from '@boulder/api-contract';
import { buildPhotoUrl, buildUploadObjectKey } from './object-key.js';
import { createR2PresignedPutUrl, type R2PresignConfig } from './r2-presign.js';

export interface CreatePresignedUploadParams {
  userId: string;
  body: PresignedUploadRequest;
  photoUrlBase: string;
  r2: R2PresignConfig;
  now?: () => number;
}

export const createPresignedUpload = async ({
  now = Date.now,
  userId,
  body,
  photoUrlBase,
  r2,
}: CreatePresignedUploadParams): Promise<PresignedUploadResponse> => {
  const timestampMs = now();
  const objectKey = buildUploadObjectKey({
    userId,
    sessionId: body.sessionId,
    entryId: body.entryId,
    index: body.index,
    contentType: body.contentType,
    timestampMs,
  });
  const photoUrl = buildPhotoUrl(photoUrlBase, objectKey);
  const uploadUrl = await createR2PresignedPutUrl({
    config: r2,
    objectKey,
    contentType: body.contentType,
    contentLength: body.contentLength,
  });

  return {
    uploadUrl,
    objectKey,
    photoUrl,
    image: {
      id: body.imageId,
      index: body.index,
      objectKey,
      photoUrl,
      contentType: body.contentType,
      contentLength: body.contentLength,
    },
  };
};
