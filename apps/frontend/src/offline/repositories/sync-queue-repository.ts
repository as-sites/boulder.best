import { db } from '../db/database.js';
import type { SyncQueueItem, SyncQueueStatus } from '../db/types.js';
import { createCrudRepository } from './base.js';

const { syncQueue: table } = db;

export const syncQueueRepository = {
  ...createCrudRepository(table),

  async listByStatus(status: SyncQueueStatus): Promise<SyncQueueItem[]> {
    return await table.where('status').equals(status).sortBy('createdAt');
  },

  async listAll(): Promise<SyncQueueItem[]> {
    return await table.orderBy('createdAt').toArray();
  },
};
