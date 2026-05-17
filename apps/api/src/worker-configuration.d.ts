/// <reference types="@cloudflare/workers-types" />
import type { AuthEnvBindings } from '@boulder/auth';

declare global {
  type CloudflareBindings = AuthEnvBindings & {
    /** R2 bucket for session photo storage */
    MEDIA_BUCKET: R2Bucket;
    /** Base URL for public photo access, e.g. https://cdn.boulder.best */
    PUBLIC_PHOTO_URL_BASE: string;
    /** Cloudflare account ID for R2 S3 API presigned URLs */
    R2_ACCOUNT_ID: string;
    /** R2 bucket name used in presigned upload URLs */
    R2_BUCKET_NAME: string;
    /** R2 S3 API access key for presigned uploads */
    R2_ACCESS_KEY_ID: string;
    /** R2 S3 API secret for presigned uploads */
    R2_SECRET_ACCESS_KEY: string;
  };
}

export {};
