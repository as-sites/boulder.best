import {
  MAX_IMAGE_UPLOAD_BYTES,
  MAX_IMAGE_UPLOAD_ERROR,
  type ImageContentType,
} from '@boulder/api-contract';

const ALLOWED_CONTENT_TYPES = new Set<ImageContentType>([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageValidationError';
  }
}

export interface ValidatedImageFile {
  contentType: ImageContentType;
  contentLength: number;
}

/** Validate a user-selected image before persisting to Dexie or upload. */
export const validateImageFile = (file: File): ValidatedImageFile => {
  if (!ALLOWED_CONTENT_TYPES.has(file.type as ImageContentType)) {
    throw new ImageValidationError(
      'Only JPEG, PNG, and WebP images are supported',
    );
  }

  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    throw new ImageValidationError(MAX_IMAGE_UPLOAD_ERROR);
  }

  return {
    contentType: file.type as ImageContentType,
    contentLength: file.size,
  };
};
