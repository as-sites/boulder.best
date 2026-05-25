import type { Context, Env } from 'hono';
import type {
  GymsResponse,
  HealthResponse,
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

export interface ApiContractHandlers<E extends Env = Env> {
  health?: (c: Context<E>) => MaybePromise<HealthResponse>;
  getGyms: (c: Context<E>) => MaybePromise<GymsResponse>;
  createPresignedUpload: (
    c: Context<E>,
    body: PresignedUploadRequest,
  ) => MaybePromise<PresignedUploadResponse>;
  syncSession: (
    c: Context<E>,
    body: SyncSessionPayload,
  ) => MaybePromise<SyncSessionSuccessResponse>;
  listSessions: (
    c: Context<E>,
    query: SessionHistoryListQuery,
  ) => MaybePromise<SessionHistoryListResponse>;
  getSessionDetail: (
    c: Context<E>,
    params: SessionIdParam,
  ) => MaybePromise<SessionDetailResponse | null>;
}
