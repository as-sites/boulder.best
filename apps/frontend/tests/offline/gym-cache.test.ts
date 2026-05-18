import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Gym } from '@boulder/api-contract';
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

  it('returns an empty list safely when cache and network are unavailable', async () => {
    vi.stubGlobal('navigator', { onLine: false });

    await expect(loadCachedGyms()).resolves.toEqual([]);
  });
});
