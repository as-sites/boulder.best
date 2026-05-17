import { describe, expectTypeOf, it } from 'vitest';
import {
  createApiClient,
  type Gym,
  type GymsResponse,
} from '@boulder/api-contract';
import { apiClient } from '../src/lib/api-client.js';

describe('frontend api-contract boundary', () => {
  it('imports the shared RPC client without apps/api', () => {
    expectTypeOf(apiClient.api.gyms.$get).toBeFunction();
    expectTypeOf(apiClient.api.sessions.sync.$post).toBeFunction();
  });

  it('types responses through the shared contract', () => {
    expectTypeOf<GymsResponse>().toEqualTypeOf<Gym[]>();
  });

  it('allows creating a client from the same export surface', () => {
    const client = createApiClient('https://api.example.com');

    expectTypeOf(client).toEqualTypeOf<ReturnType<typeof createApiClient>>();
    expectTypeOf(client.api.uploads['presigned-url'].$post).toBeFunction();
  });
});
