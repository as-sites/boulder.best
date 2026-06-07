import { db } from '../db/database.js';
import type { OfflineImage } from '../db/types.js';
import { createCrudRepository } from './base.js';

const { offlineImages: table } = db;

export const offlineImagesRepository = {
  ...createCrudRepository(table),

  async listByEntry(
    sessionId: string,
    entryId: string,
  ): Promise<OfflineImage[]> {
    return await table
      .where('[sessionId+entryId]')
      .equals([sessionId, entryId])
      .sortBy('index');
  },

  async listBySession(sessionId: string): Promise<OfflineImage[]> {
    return await table.where('sessionId').equals(sessionId).sortBy('index');
  },

  async deleteBySessionId(sessionId: string): Promise<void> {
    await table.where('sessionId').equals(sessionId).delete();
  },
};
