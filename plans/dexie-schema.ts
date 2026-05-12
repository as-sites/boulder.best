// oxlint-disable typescript/explicit-member-accessibility
import Dexie, { type Table } from 'dexie';

// --- TYPES & INTERFACES ---

export interface CachedGym {
  id: string; // UUID from Postgres
  name: string;
  grades: string[];
  updatedAt: number; // Used to check if we need to pull fresh gym data
}

export interface OfflineImage {
  id: string; // Random UUID generated on client
  climbId: string; // Links this blob to a specific climb entry
  blob: Blob; // The actual compressed image file
  createdAt: number;
}

// This represents the entire structured session ready for the Hono API
export interface SyncSessionPayload {
  id: string; // Random UUID
  gymId: string;
  startTime: string; // ISO string (Temporal API)
  endTime: string;
  totalDurationMs: number;
  notes?: string | null;
  entries: Array<{
    id: string;
    sequenceOrder: number;
    type: 'climb' | 'break';
    durationMs: number;
    // Climb specifics
    name?: string | null;
    grade?: string | null;
    attempts?: number | null;
    completed?: boolean | null;
    notes?: string | null;
    // Note: photoUrl is omitted here because offline, we only have a local Blob ID.
    // The sync process uploads the blob to R2, gets the URL, and injects it before sending.
    localImageId?: string | null;
  }>;
}

export interface SyncQueueItem {
  id: string; // Matches the session ID
  payload: SyncSessionPayload;
  status: 'pending' | 'syncing' | 'error';
  retryCount: number;
  lastError?: string;
  createdAt: number;
}

export interface DraftSession {
  // We strictly use 'active' as the ID so there is always only one draft
  id: 'active';
  gymId: string | null;
  // This can directly map to your react-hook-form values
  // oxlint-disable-next-line typescript/no-explicit-any
  formData: any;
  lastSavedAt: number;
}

// --- DEXIE DATABASE DEFINITION ---

export class BoulderingTrackerDB extends Dexie {
  cachedGyms!: Table<CachedGym, string>;
  offlineImages!: Table<OfflineImage, string>;
  syncQueue!: Table<SyncQueueItem, string>;
  draftSession!: Table<DraftSession, string>;

  constructor() {
    super('BoulderingTrackerDB');

    // In Dexie, you ONLY list the properties you want to be able to index/query by.
    // E.g., 'id' is the primary key. 'climbId' is an index so we can easily find an image for a climb.
    // You do NOT list the full schema here (like 'blob' or 'payload').
    this.version(1).stores({
      cachedGyms: 'id, name', // Primary key 'id', indexed by 'name'
      offlineImages: 'id, climbId', // Primary key 'id', indexed by 'climbId'
      syncQueue: 'id, status, createdAt', // Indexed by status to easily query 'pending' items
      draftSession: 'id', // Just the primary key ('active')
    });
  }
}

// Export a singleton instance to use throughout the React app
export const db = new BoulderingTrackerDB();
