import type { Gym } from '@boulder/api-contract';
import { apiClient } from '../../lib/api-client.js';
import { ApiError, apiErrorFromResponse } from '../../lib/fetch-error.js';
import { cachedGymsRepository } from '../repositories/cached-gyms-repository.js';

export type FetchGyms = () => Promise<Gym[]>;

export const fetchGymsFromApi: FetchGyms = async () => {
  const response = await apiClient.api.gyms.$get();

  if (!response.ok) {
    throw apiErrorFromResponse(response);
  }

  return await response.json();
};

export const refreshCachedGymsFromApi = async (
  fetchGyms: FetchGyms = fetchGymsFromApi,
): Promise<Gym[]> => {
  const gyms = await fetchGyms();
  await cachedGymsRepository.upsertMany(gyms);
  return gyms;
};

/**
 * Returns cached gyms, refreshing from the API when online and the request
 * succeeds. Falls back to IndexedDB when offline or the network call fails.
 */
export const loadCachedGyms = async (options?: {
  refreshWhenOnline?: boolean;
  fetchGyms?: FetchGyms;
}): Promise<Gym[]> => {
  const shouldRefresh =
    options?.refreshWhenOnline !== false && navigator.onLine;

  if (shouldRefresh) {
    try {
      return await refreshCachedGymsFromApi(options?.fetchGyms);
    } catch (error) {
      if (error instanceof ApiError) {
        // A real API / server error — re-throw so the caller can surface it.
        throw error;
      }
      // Network error or other unexpected failure — fall back to the last known cache.
    }
  }

  return await cachedGymsRepository.listAll();
};
