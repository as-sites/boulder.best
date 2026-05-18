import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema.js';

export const createDb = (databaseUrl: string) => {
  const sql = neon(databaseUrl);
  return drizzle({ client: sql, schema });
};

export type AppDb = ReturnType<typeof createDb>;
