export type PersistentStorageStatus = 'granted' | 'denied' | 'unsupported';

/** Normalize app `Date` values to ISO strings for Dexie and API payloads. */
export const toIsoDateTime = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : value;

const hasPersistentStorageApi = (): boolean =>
  'storage' in navigator &&
  typeof navigator.storage.persist === 'function' &&
  typeof navigator.storage.persisted === 'function';

/** Read whether the origin already has persistent storage. */
export const getPersistentStorageStatus =
  async (): Promise<PersistentStorageStatus> => {
    if (!hasPersistentStorageApi()) {
      return 'unsupported';
    }

    if (await navigator.storage.persisted()) {
      return 'granted';
    }

    try {
      return (await navigator.storage.persist()) ? 'granted' : 'denied';
    } catch {
      return 'denied';
    }
  };

/**
 * Ask the browser to mark origin storage as persistent so IndexedDB is less
 * likely to be evicted under storage pressure.
 */
export const requestPersistentStorage = async (): Promise<boolean> => {
  const status = await getPersistentStorageStatus();
  return status === 'granted';
};
