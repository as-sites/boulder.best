import type { SessionDetailEntry, SyncedImage } from '@boulder/api-contract';

export const sortSessionDetailEntries = (
  entries: SessionDetailEntry[],
): SessionDetailEntry[] =>
  entries.toSorted((left, right) => left.sequenceOrder - right.sequenceOrder);

export const sortSyncedImages = (images: SyncedImage[]): SyncedImage[] =>
  images.toSorted((left, right) => left.index - right.index);
