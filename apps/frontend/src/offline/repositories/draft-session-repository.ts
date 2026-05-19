import { db } from '../db/database.js';
import {
  ACTIVE_DRAFT_SESSION_ID,
  type DraftSession,
  type SessionFormValues,
} from '../db/types.js';
import { createCrudRepository } from './base.js';

const { draftSession: table } = db;

export const draftSessionRepository = {
  ...createCrudRepository(table),

  async getActive(): Promise<DraftSession | undefined> {
    return await table.get(ACTIVE_DRAFT_SESSION_ID);
  },

  async saveActive(input: {
    formData: SessionFormValues;
    lastSavedAt?: number;
  }): Promise<DraftSession> {
    const draft: DraftSession = {
      id: ACTIVE_DRAFT_SESSION_ID,
      formData: input.formData,
      lastSavedAt: input.lastSavedAt ?? Date.now(),
    };

    await table.put(draft);
    return draft;
  },

  async clearActive(): Promise<void> {
    await table.delete(ACTIVE_DRAFT_SESSION_ID);
  },
};
