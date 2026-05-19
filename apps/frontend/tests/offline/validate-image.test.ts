import { describe, expect, it } from 'vitest';
import { MAX_IMAGE_UPLOAD_BYTES } from '@boulder/api-contract';
import {
  ImageValidationError,
  mapFileToOfflineImage,
  validateImageFile,
} from '../../src/offline/index.js';

describe('image file validation', () => {
  it('accepts jpeg, png, and webp under the size limit', () => {
    const jpeg = new File(['jpeg'], 'photo.jpg', { type: 'image/jpeg' });

    expect(validateImageFile(jpeg)).toEqual({
      contentType: 'image/jpeg',
      contentLength: 4,
    });
  });

  it('rejects unsupported mime types', () => {
    const gif = new File(['gif'], 'photo.gif', { type: 'image/gif' });

    expect(() => validateImageFile(gif)).toThrow(ImageValidationError);
  });

  it('rejects files over 30 MB', () => {
    const bytes = new Uint8Array(MAX_IMAGE_UPLOAD_BYTES + 1);
    const huge = new File([bytes], 'huge.jpg', { type: 'image/jpeg' });

    expect(() => validateImageFile(huge)).toThrow(ImageValidationError);
  });
});

describe('offline image mapping', () => {
  it('maps validated metadata with a stable index and blob', () => {
    const file = new File(['pixels'], 'shot.webp', { type: 'image/webp' });
    const image = mapFileToOfflineImage({
      file,
      sessionId: 'session-1',
      entryId: 'entry-1',
      index: 2,
      imageId: 'image-1',
      createdAt: 1_700_000_000_000,
    });

    expect(image).toMatchObject({
      id: 'image-1',
      sessionId: 'session-1',
      entryId: 'entry-1',
      index: 2,
      contentType: 'image/webp',
      contentLength: 6,
      createdAt: 1_700_000_000_000,
    });
    expect(image.blob).toBe(file);
  });
});
