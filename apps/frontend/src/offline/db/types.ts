import type {
  PresignedUploadRequest,
  SyncBreakEntry,
  SyncClimbAttempt,
  SyncClimbEntry,
  SyncSessionPayload,
} from '@boulder/api-contract';
import type { TimerState } from '../../lib/timer/types.js';

export type SyncQueueStatus = 'pending' | 'syncing' | 'error' | 'synced';

export type { TimerState };

/**
 * Local blob store row; presign fields from {@link PresignedUploadRequest} plus
 * blob and createdAt.
 */
export type OfflineImageUploadStatus = 'pending' | 'uploaded';

export type OfflineImage = Pick<
  PresignedUploadRequest,
  'sessionId' | 'entryId' | 'index' | 'contentType' | 'contentLength'
> & {
  id: PresignedUploadRequest['imageId'];
  blob: Blob;
  createdAt: number;
  uploadStatus: OfflineImageUploadStatus;
  objectKey?: string;
  photoUrl?: string;
  uploadedAt?: number;
};

/** Per-attempt draft row with pause-resilient timer state. */
export interface ClimbAttemptFormEntry extends SyncClimbAttempt {
  timer: TimerState;
}

/** Draft climb row; `images` live in {@link OfflineImage}, not form JSON. */
export interface ClimbFormEntry extends Omit<
  SyncClimbEntry,
  'images' | 'climbAttempts'
> {
  timer: TimerState;
  climbAttempts: ClimbAttemptFormEntry[];
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
