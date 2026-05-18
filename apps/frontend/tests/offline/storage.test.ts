import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getPersistentStorageStatus,
  requestPersistentStorage,
} from '../../src/offline/storage.js';

describe('persistent storage helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns unsupported when the Storage API is missing', async () => {
    vi.stubGlobal('navigator', {});

    await expect(getPersistentStorageStatus()).resolves.toBe('unsupported');
    await expect(requestPersistentStorage()).resolves.toBe(false);
  });

  it('returns granted when persistence is already enabled', async () => {
    vi.stubGlobal('navigator', {
      storage: {
        persisted: vi.fn().mockResolvedValue(true),
        persist: vi.fn(),
      },
    });

    await expect(getPersistentStorageStatus()).resolves.toBe('granted');
    await expect(requestPersistentStorage()).resolves.toBe(true);
  });

  it('returns denied when persistence is rejected', async () => {
    vi.stubGlobal('navigator', {
      storage: {
        persisted: vi.fn().mockResolvedValue(false),
        persist: vi.fn().mockResolvedValue(false),
      },
    });

    await expect(getPersistentStorageStatus()).resolves.toBe('denied');
    await expect(requestPersistentStorage()).resolves.toBe(false);
  });
});
