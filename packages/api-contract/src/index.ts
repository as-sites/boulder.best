export { apiClientOptions, createApiClient, createApiContract } from './app.js';
export type { ApiAppType } from './app.js';
export type { ApiContractHandlers } from './routes.js';

export { openApiDocumentConfig, openApiJsonPath } from './openapi.js';
export {
  createPresignedUploadRoute,
  getGymsRoute,
  getSessionDetailRoute,
  listSessionsRoute,
  mvpOpenApiRoutes,
  syncSessionRoute,
} from './openapi-routes.js';

export { MAX_IMAGE_UPLOAD_BYTES, MAX_IMAGE_UPLOAD_ERROR } from './constants.js';
export {
  CUSTOM_V_SCALE_GYM_ID,
  CUSTOM_V_SCALE_GYM_NAME,
  V_SCALE_GRADES,
} from './gyms.js';

export {
  apiErrorResponseSchema,
  gymSchema,
  gymsResponseSchema,
  healthResponseSchema,
  helloResponseSchema,
  imageContentTypeSchema,
  presignedUploadRequestSchema,
  presignedUploadResponseSchema,
  sessionDetailBreakEntrySchema,
  sessionDetailClimbEntrySchema,
  sessionDetailEntrySchema,
  sessionDetailResponseSchema,
  sessionHistoryCursorSchema,
  sessionHistoryListItemSchema,
  sessionHistoryListQuerySchema,
  sessionHistoryListResponseSchema,
  sessionIdParamSchema,
  syncBreakEntrySchema,
  syncClimbAttemptSchema,
  syncClimbEntrySchema,
  syncSessionEntrySchema,
  syncSessionPayloadSchema,
  syncSessionSuccessResponseSchema,
  syncedImageSchema,
  type ApiErrorResponse,
  type Gym,
  type GymsResponse,
  type HealthResponse,
  type HelloResponse,
  type ImageContentType,
  type PresignedUploadRequest,
  type PresignedUploadResponse,
  type SessionDetailBreakEntry,
  type SessionDetailClimbEntry,
  type SessionDetailEntry,
  type SessionDetailResponse,
  type SessionHistoryCursor,
  type SessionHistoryListItem,
  type SessionHistoryListQuery,
  type SessionHistoryListResponse,
  type SessionIdParam,
  type SyncBreakEntry,
  type SyncClimbAttempt,
  type SyncClimbEntry,
  type SyncSessionEntry,
  type SyncSessionPayload,
  type SyncSessionSuccessResponse,
  type SyncedImage,
} from './schemas.js';
