import type { Gym } from '@boulder/api-contract';
import { db } from '../db/database.js';
import { createCrudRepository } from './base.js';

const { cachedGyms: table } = db;

export const cachedGymsRepository = {
  ...createCrudRepository(table),

  async upsertMany(gyms: Gym[]): Promise<void> {
    await table.bulkPut(gyms);
  },

  async getByName(name: string): Promise<Gym | undefined> {
    return await table.where('name').equals(name).first();
  },
};
