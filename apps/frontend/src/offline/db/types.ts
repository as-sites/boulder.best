import type {
  PresignedUploadRequest,
  SyncBreakEntry,
  SyncClimbEntry,
  SyncSessionPayload,
} from '@boulder/api-contract';

export type SyncQueueStatus = 'pending' | 'syncing' | 'error' | 'synced';

/**
 * Local blob store row; presign fields from {@link PresignedUploadRequest} plus
 * blob and createdAt.
 */
export type OfflineImage = Pick<
  PresignedUploadRequest,
  'sessionId' | 'entryId' | 'index' | 'contentType' | 'contentLength'
> & {
  id: PresignedUploadRequest['imageId'];
  blob: Blob;
  createdAt: number;
};

export interface TimerState {
  accumulatedDurationMs: number;
  activeStartTime: string | null;
  status: 'idle' | 'running' | 'paused' | 'stopped';
}

/** Draft climb row; `images` live in {@link OfflineImage}, not form JSON. */
export interface ClimbFormEntry extends Omit<SyncClimbEntry, 'images'> {
  timer: TimerState;
}

export interface BreakFormEntry extends SyncBreakEntry {
  timer: TimerState;
}

export type SessionFormEntry = ClimbFormEntry | BreakFormEntry;

/**
 * In-progress session form; nullable fields until the user finishes the
 * session.
 */
export interface SessionFormValues extends Pick<
  SyncSessionPayload,
  'id' | 'totalDurationMs' | 'notes'
> {
  gymId: string | null;
  startTime: string | null;
  endTime: string | null;
  status: 'not_started' | 'active' | 'stopped';
  entries: SessionFormEntry[];
}

export const ACTIVE_DRAFT_SESSION_ID = 'active' as const;

export type DraftSessionId = typeof ACTIVE_DRAFT_SESSION_ID;

export interface DraftSession {
  id: DraftSessionId;
  formData: SessionFormValues;
  lastSavedAt: number;
}

export interface SyncQueueItem {
  id: string;
  sessionId: string;
  payload: SyncSessionPayload;
  status: SyncQueueStatus;
  retryCount: number;
  lastError?: string;
  nextRetryAt?: number;
  createdAt: number;
  updatedAt: number;
}
