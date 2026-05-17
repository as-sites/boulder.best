import type { Context } from 'hono';
import type {
  GymsResponse,
  HealthResponse,
  HelloResponse,
  PresignedUploadRequest,
  PresignedUploadResponse,
  SessionDetailResponse,
  SessionHistoryListQuery,
  SessionHistoryListResponse,
  SessionIdParam,
  SyncSessionPayload,
  SyncSessionSuccessResponse,
} from './schemas.js';

type MaybePromise<T> = T | Promise<T>;

export interface ApiContractHandlers {
  hello: (c: Context) => MaybePromise<HelloResponse>;
  health?: (c: Context) => MaybePromise<HealthResponse>;
  getGyms: (c: Context) => MaybePromise<GymsResponse>;
  createPresignedUpload: (
    c: Context,
    body: PresignedUploadRequest,
  ) => MaybePromise<PresignedUploadResponse>;
  syncSession: (
    c: Context,
    body: SyncSessionPayload,
  ) => MaybePromise<SyncSessionSuccessResponse>;
  listSessions: (
    c: Context,
    query: SessionHistoryListQuery,
  ) => MaybePromise<SessionHistoryListResponse>;
  getSessionDetail: (
    c: Context,
    params: SessionIdParam,
  ) => MaybePromise<SessionDetailResponse | null>;
}
