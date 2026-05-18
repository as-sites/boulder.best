/** Normalize app `Date` values to ISO strings for Dexie and API payloads. */
export const toIsoDateTime = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : value;

/**
 * Ask the browser to mark origin storage as persistent so IndexedDB is less
 * likely to be evicted under storage pressure.
 */
export const requestPersistentStorage = async (): Promise<boolean> => {
  if (
    !('storage' in navigator) ||
    typeof navigator.storage.persist !== 'function'
  ) {
    return false;
  }

  return await navigator.storage.persist();
};
