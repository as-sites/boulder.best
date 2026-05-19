import type { OfflineImage } from '../db/types.js';
import { validateImageFile } from './validate-image.js';

export interface MapFileToOfflineImageInput {
  file: File;
  sessionId: string;
  entryId: string;
  index: number;
  imageId?: string;
  createdAt?: number;
}

/** Map a validated local file to an {@link OfflineImage} row (Blob, not Base64). */
export const mapFileToOfflineImage = ({
  file,
  sessionId,
  entryId,
  index,
  imageId = crypto.randomUUID(),
  createdAt = Date.now(),
}: MapFileToOfflineImageInput): OfflineImage => {
  const { contentType, contentLength } = validateImageFile(file);

  return {
    id: imageId,
    sessionId,
    entryId,
    index,
    blob: file,
    contentType,
    contentLength,
    createdAt,
  };
};
