import {
  presignedUploadResponseSchema,
  type SyncedImage,
} from '@boulder/api-contract';
import { apiClient } from '../../lib/api-client.js';
import { mapWithConcurrency } from '../../lib/map-with-concurrency.js';
import type { OfflineImage } from '../db/types.js';
import { offlineImagesRepository } from '../repositories/offline-images-repository.js';

const OFFLINE_IMAGE_UPLOAD_CONCURRENCY = 3;

export const isOfflineImageUploaded = (image: OfflineImage): boolean =>
  image.uploadStatus === 'uploaded' &&
  image.objectKey !== undefined &&
  image.photoUrl !== undefined;

export const toSyncedImage = (image: OfflineImage): SyncedImage => {
  if (!isOfflineImageUploaded(image) || !image.objectKey || !image.photoUrl) {
    throw new Error('Offline image is missing remote upload metadata');
  }

  return {
    id: image.id,
    index: image.index,
    objectKey: image.objectKey,
    photoUrl: image.photoUrl,
    contentType: image.contentType,
    contentLength: image.contentLength,
  };
};

export const uploadOfflineImage = async (
  image: OfflineImage,
): Promise<OfflineImage> => {
  if (isOfflineImageUploaded(image)) {
    return image;
  }

  const presignResponse = await apiClient.api.uploads['presigned-url'].$post({
    json: {
      sessionId: image.sessionId,
      entryId: image.entryId,
      imageId: image.id,
      index: image.index,
      contentType: image.contentType,
      contentLength: image.contentLength,
    },
  });

  if (!presignResponse.ok) {
    throw new Error(`Presign request failed (${presignResponse.status})`);
  }

  const presignJson: unknown = await presignResponse.json();
  const parsedPresign = presignedUploadResponseSchema.safeParse(presignJson);
  if (!parsedPresign.success) {
    throw new Error('Presign response failed validation');
  }
  const { data: presigned } = parsedPresign;

  const uploadResponse = await fetch(presigned.uploadUrl, {
    method: 'PUT',
    body: image.blob,
    headers: {
      'Content-Type': image.contentType,
    },
  });

  if (!uploadResponse.ok) {
    throw new Error(`Image upload failed (${uploadResponse.status})`);
  }

  const uploaded: OfflineImage = {
    ...image,
    uploadStatus: 'uploaded',
    objectKey: presigned.objectKey,
    photoUrl: presigned.photoUrl,
    uploadedAt: Date.now(),
  };

  await offlineImagesRepository.put(uploaded);
  return uploaded;
};

export const uploadOfflineImagesForSession = async (
  sessionId: string,
): Promise<OfflineImage[]> => {
  const images = await offlineImagesRepository.listBySession(sessionId);

  return await mapWithConcurrency(
    images,
    OFFLINE_IMAGE_UPLOAD_CONCURRENCY,
    uploadOfflineImage,
  );
};
