export {
  BoulderingTrackerDB,
  db,
  OFFLINE_DB_NAME,
  resetOfflineDatabase,
} from './db/database.js';
export type {
  BreakFormEntry,
  ClimbAttemptFormEntry,
  ClimbFormEntry,
  DraftSession,
  DraftSessionId,
  OfflineImage,
  SessionFormEntry,
  SessionFormValues,
  SyncQueueItem,
  SyncQueueStatus,
  TimerState,
} from './db/types.js';
export { ACTIVE_DRAFT_SESSION_ID } from './db/types.js';
export type {
  Gym,
  ImageContentType,
  SyncBreakEntry,
  SyncClimbAttempt,
  SyncClimbEntry,
  SyncSessionEntry,
  SyncSessionPayload,
  SyncedImage,
} from '@boulder/api-contract';
export {
  autosaveActiveDraft,
  restoreActiveDraft,
} from './draft/draft-autosave.js';
export {
  buildSyncSessionPayload,
  finalizeStoppedSession,
} from './draft/finalize-session.js';
export { loadCachedGyms, refreshCachedGymsFromApi } from './gyms/gym-cache.js';
export {
  cachedGymsRepository,
  createCrudRepository,
  draftSessionRepository,
  offlineImagesRepository,
  syncQueueRepository,
  type CrudRepository,
} from './repositories/index.js';
export {
  useActiveDraftSession,
  useSyncNow,
  useSyncQueueErrorCount,
  useSyncQueueErrorList,
  useSyncQueueHasWork,
  useSyncQueueLastError,
  useSyncQueueList,
  useSyncQueuePendingCount,
  useSyncQueueStats,
  type SyncQueueStats,
  type SyncQueueSummary,
} from './hooks/index.js';
export { createIdleTimer } from '../lib/timer/index.js';
export { requestPersistentStorage } from './storage.js';
export {
  ImageValidationError,
  validateImageFile,
  type ValidatedImageFile,
} from './images/validate-image.js';
export {
  mapFileToOfflineImage,
  type MapFileToOfflineImageInput,
} from './images/map-file-to-offline-image.js';
export {
  canProcessSyncQueue,
  computeNextRetryAt,
  isQueueItemReadyForAttempt,
  listEligibleQueueItems,
  markQueueItemError,
  markQueueItemSynced,
  markQueueItemSyncing,
  type SyncQueueRuntimeContext,
} from './sync/queue-orchestration.js';
export {
  isOfflineImageUploaded,
  toSyncedImage,
  uploadOfflineImage,
  uploadOfflineImagesForSession,
} from './sync/upload-offline-image.js';
export { attachSyncedImagesToPayload } from './sync/attach-synced-images.js';
export {
  buildSessionSyncPayload,
  submitSyncSession,
} from './sync/submit-sync-session.js';
export { drainSyncQueue, SYNCING_STALE_MS } from './sync/drain-sync-queue.js';
export {
  buildFailedSyncExport,
  buildFailedSyncExportFilename,
  clearFailedSyncQueueItem,
  downloadFailedSyncExport,
  type FailedSyncExport,
  type FailedSyncExportImageMeta,
} from './sync/failed-sync-recovery.js';
