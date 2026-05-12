import type { Context } from 'hono';
import type { HealthResponse, HelloResponse } from './schemas.js';

type MaybePromise<T> = T | Promise<T>;

export interface ApiContractHandlers {
  hello: (c: Context) => MaybePromise<HelloResponse>;
  health?: (c: Context) => MaybePromise<HealthResponse>;
}
