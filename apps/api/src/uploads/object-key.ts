import type { ImageContentType } from '@boulder/api-contract';

const extensionByContentType: Record<ImageContentType, string> = {
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const extensionForContentType = (
  contentType: ImageContentType,
): string => extensionByContentType[contentType];

export const buildUploadObjectKey = ({
  timestampMs = Date.now(),
  userId,
  sessionId,
  entryId,
  index,
  contentType,
}: {
  userId: string;
  sessionId: string;
  entryId: string;
  index: number;
  contentType: ImageContentType;
  timestampMs?: number;
}): string =>
  `${userId}/${sessionId}/${entryId}/${timestampMs}-${index}.${extensionForContentType(contentType)}`;

export const buildPhotoUrl = (baseUrl: string, objectKey: string): string => {
  const normalizedBase = baseUrl.replace(/\/$/, '');

  return `${normalizedBase}/${objectKey}`;
};
