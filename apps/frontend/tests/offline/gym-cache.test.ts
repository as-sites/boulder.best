import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Gym } from '@boulder/api-contract';
import { ApiError } from '../../src/lib/fetch-error.js';
import {
  cachedGymsRepository,
  loadCachedGyms,
  refreshCachedGymsFromApi,
  resetOfflineDatabase,
} from '../../src/offline/index.js';

const gymFixture = (): Gym => ({
  id: 'a1b2c3d4-e5f6-4789-a234-56789abcdef0',
  name: 'Test Gym',
  grades: ['V0', 'V1'],
  locations: ['Main Wall'],
  updatedAt: '2026-05-13T08:00:00.000Z',
});

describe('gym cache', () => {
  beforeEach(async () => {
    await resetOfflineDatabase();
    vi.stubGlobal('navigator', { onLine: true });
  });

  it('stores gyms from the API', async () => {
    const gym = gymFixture();
    const fetchGyms = vi.fn().mockResolvedValue([gym]);

    await expect(refreshCachedGymsFromApi(fetchGyms)).resolves.toEqual([gym]);
    await expect(cachedGymsRepository.get(gym.id)).resolves.toEqual(gym);
  });

  it('falls back to cached gyms when offline', async () => {
    const gym = gymFixture();
    await cachedGymsRepository.put(gym);
    vi.stubGlobal('navigator', { onLine: false });

    const fetchGyms = vi.fn();
    await expect(loadCachedGyms({ fetchGyms })).resolves.toEqual([gym]);
    expect(fetchGyms).not.toHaveBeenCalled();
  });

  it('uses online refresh results when available instead of offline cache fallback', async () => {
    const staleGym = gymFixture();
    await cachedGymsRepository.put(staleGym);
    const freshGym = { ...staleGym, name: 'Fresh Gym Name' };
    const fetchGyms = vi.fn().mockResolvedValue([freshGym]);

    await expect(loadCachedGyms({ fetchGyms })).resolves.toEqual([freshGym]);
    expect(fetchGyms).toHaveBeenCalledOnce();
    await expect(cachedGymsRepository.get(staleGym.id)).resolves.toEqual(
      freshGym,
    );
  });

  it('falls back to cache when online refresh fails', async () => {
    const gym = gymFixture();
    await cachedGymsRepository.put(gym);
    const fetchGyms = vi.fn().mockRejectedValue(new Error('Rate limited'));

    await expect(loadCachedGyms({ fetchGyms })).resolves.toEqual([gym]);
    expect(fetchGyms).toHaveBeenCalledOnce();
  });

  it('returns an empty list safely when cache and network are unavailable', async () => {
    vi.stubGlobal('navigator', { onLine: false });

    await expect(loadCachedGyms()).resolves.toEqual([]);
  });

  it('falls back to cached gyms on network error when online', async () => {
    const gym = gymFixture();
    await cachedGymsRepository.put(gym);

    const fetchGyms = vi
      .fn()
      .mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(loadCachedGyms({ fetchGyms })).resolves.toEqual([gym]);
  });

  it('propagates API errors rather than silently falling back to cache', async () => {
    const gym = gymFixture();
    await cachedGymsRepository.put(gym);

    const apiErr = new ApiError(500, 'Request failed with status 500');
    const fetchGyms = vi.fn().mockRejectedValue(apiErr);

    await expect(loadCachedGyms({ fetchGyms })).rejects.toBeInstanceOf(
      ApiError,
    );
  });
});
