import type { Gym } from '@boulder/api-contract';
import Dexie, { type Table } from 'dexie';
import type {
  DraftSession,
  DraftSessionId,
  OfflineImage,
  SyncQueueItem,
} from './types.js';

export const OFFLINE_DB_NAME = 'BoulderingTrackerDB';

export class BoulderingTrackerDB extends Dexie {
  public cachedGyms!: Table<Gym, string>;
  public draftSession!: Table<DraftSession, DraftSessionId>;
  public syncQueue!: Table<SyncQueueItem, string>;
  public offlineImages!: Table<OfflineImage, string>;

  constructor(name = OFFLINE_DB_NAME) {
    super(name);

    this.version(1).stores({
      cachedGyms: 'id, name, updatedAt',
      draftSession: 'id',
      syncQueue: 'id, sessionId, status, createdAt, updatedAt, nextRetryAt',
      offlineImages: 'id, sessionId, entryId, [sessionId+entryId]',
    });
  }
}

export const db = new BoulderingTrackerDB();

export const resetOfflineDatabase = async (): Promise<void> => {
  if (db.isOpen()) {
    db.close();
  }
  await db.delete();
  await db.open();
};
