import type { GymsResponse } from '@boulder/api-contract';
import { asc } from 'drizzle-orm';
import type { AppDb } from '../db/index.js';
import { gyms } from '../db/schema.js';

function toIsoDateTime(value: Date): string {
  return value.toISOString();
}

export async function listGyms(db: AppDb): Promise<GymsResponse> {
  const rows = await db
    .select({
      id: gyms.id,
      name: gyms.name,
      grades: gyms.grades,
      updatedAt: gyms.updatedAt,
    })
    .from(gyms)
    .orderBy(asc(gyms.name));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    grades: [...row.grades],
    updatedAt: toIsoDateTime(row.updatedAt),
  }));
}
