import type { Gym } from '@boulder/api-contract';
import { useQuery } from '@tanstack/react-query';
import { loadCachedGyms } from '../offline/gyms/gym-cache.js';

export const cachedGymsQueryKey = ['cached-gyms'] as const;

export const useCachedGymsQuery = () =>
  useQuery({
    queryKey: cachedGymsQueryKey,
    queryFn: async (): Promise<Gym[]> => await loadCachedGyms(),
    staleTime: 60_000,
  });
