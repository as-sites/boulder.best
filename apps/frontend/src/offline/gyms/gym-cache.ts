import type { Gym } from '@boulder/api-contract';
import { apiClient } from '../../lib/api-client.js';
import { cachedGymsRepository } from '../repositories/cached-gyms-repository.js';

export type FetchGyms = () => Promise<Gym[]>;

export const fetchGymsFromApi: FetchGyms = async () => {
  const response = await apiClient.api.gyms.$get();

  if (!response.ok) {
    throw new Error(`Failed to fetch gyms (${response.status})`);
  }

  return await response.json();
};

export async function refreshCachedGymsFromApi(
  fetchGyms: FetchGyms = fetchGymsFromApi,
): Promise<Gym[]> {
  const gyms = await fetchGyms();
  await cachedGymsRepository.upsertMany(gyms);
  return gyms;
}

/**
 * Returns cached gyms, refreshing from the API when online and the request
 * succeeds. Falls back to IndexedDB when offline or the network call fails.
 */
export async function loadCachedGyms(options?: {
  refreshWhenOnline?: boolean;
  fetchGyms?: FetchGyms;
}): Promise<Gym[]> {
  const shouldRefresh =
    options?.refreshWhenOnline !== false && navigator.onLine;

  if (shouldRefresh) {
    try {
      return await refreshCachedGymsFromApi(options?.fetchGyms);
    } catch {
      // Use the last known cache when refresh fails.
    }
  }

  return await cachedGymsRepository.listAll();
}
