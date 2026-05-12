import { z } from '@hono/zod-openapi';

export const helloResponseSchema = z.object({
  message: z.string(),
});

export const healthResponseSchema = z.object({
  ok: z.boolean(),
});

export type HelloResponse = z.infer<typeof helloResponseSchema>;
export type HealthResponse = z.infer<typeof healthResponseSchema>;
