import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema.js';

export const createDb = (databaseUrl: string) =>
  drizzle({ client: neon(databaseUrl), schema });

export type AppDb = ReturnType<typeof createDb>;

const dbByUrl = new Map<string, AppDb>();

/** Reuses one Drizzle client per database URL within a Worker isolate. */
export const getDb = (databaseUrl: string): AppDb => {
  const db = dbByUrl.getOrInsertComputed(databaseUrl, () =>
    createDb(databaseUrl),
  );

  return db;
};
