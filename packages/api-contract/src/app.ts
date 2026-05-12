import { Hono } from 'hono';
import { hc } from 'hono/client';
import type { ApiContractHandlers } from './routes.js';

export function createApiContract(handlers: ApiContractHandlers) {
  return new Hono()
    .get('/api/hello', async (c) => c.json(await handlers.hello(c)))
    .get('/health', async (c) => {
      const response = await handlers.health?.(c);
      return c.json(response ?? { ok: true });
    });
}

export type ApiAppType = ReturnType<typeof createApiContract>;

export function createApiClient(baseUrl: string) {
  return hc<ApiAppType>(baseUrl);
}
