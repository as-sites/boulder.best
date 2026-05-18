/** Normalize app `Date` values to ISO strings for Dexie and API payloads. */
export function toIsoDateTime(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

/**
 * Ask the browser to mark origin storage as persistent so IndexedDB is less
 * likely to be evicted under storage pressure.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (
    !('storage' in navigator) ||
    typeof navigator.storage.persist !== 'function'
  ) {
    return false;
  }

  return await navigator.storage.persist();
}
