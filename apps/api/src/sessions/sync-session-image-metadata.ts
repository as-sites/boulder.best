import type { SyncClimbEntry } from '@boulder/api-contract';
import { extensionForContentType } from '../uploads/object-key.js';

export class SyncSessionInvalidImageMetadataError extends Error {
  public readonly name = 'SyncSessionInvalidImageMetadataError';
  public readonly status = 400;

  constructor() {
    super(
      'Image objectKey or photoUrl does not match the expected upload path',
    );
  }
}

const objectKeySuffixPattern = /^\d+-\d+\.(jpeg|png|webp)$/;

const photoUrlMatchesObjectKey = (
  photoUrl: string,
  objectKey: string,
): boolean => {
  try {
    const { pathname } = new URL(photoUrl);
    return pathname.endsWith(`/${objectKey}`) || pathname.endsWith(objectKey);
  } catch {
    return false;
  }
};

export const assertValidSyncedImageMetadata = ({
  userId,
  sessionId,
  entryId,
  image,
}: {
  userId: string;
  sessionId: string;
  entryId: string;
  image: SyncClimbEntry['images'][number];
}): void => {
  const prefix = `${userId}/${sessionId}/${entryId}/`;
  const expectedExtension = extensionForContentType(image.contentType);

  if (!image.objectKey.startsWith(prefix)) {
    throw new SyncSessionInvalidImageMetadataError();
  }

  const suffix = image.objectKey.slice(prefix.length);
  if (!objectKeySuffixPattern.test(suffix)) {
    throw new SyncSessionInvalidImageMetadataError();
  }

  if (!suffix.endsWith(`.${expectedExtension}`)) {
    throw new SyncSessionInvalidImageMetadataError();
  }

  const [, indexPart] = suffix.split('-');
  const indexFromKey = Number.parseInt(indexPart?.split('.')[0] ?? '', 10);
  if (indexFromKey !== image.index) {
    throw new SyncSessionInvalidImageMetadataError();
  }

  if (!photoUrlMatchesObjectKey(image.photoUrl, image.objectKey)) {
    throw new SyncSessionInvalidImageMetadataError();
  }
};

export const assertValidSyncedImagesForEntry = ({
  userId,
  sessionId,
  entry,
}: {
  userId: string;
  sessionId: string;
  entry: SyncClimbEntry;
}): void => {
  for (const image of entry.images) {
    assertValidSyncedImageMetadata({
      userId,
      sessionId,
      entryId: entry.id,
      image,
    });
  }
};
