/// <reference types="@cloudflare/workers-types" />
import type { AuthEnvBindings } from '@boulder/auth';

declare global {
  type CloudflareBindings = AuthEnvBindings & {
    /** R2 bucket for session photo storage */
    MEDIA_BUCKET: R2Bucket;
    /** Base URL for public photo access, e.g. https://cdn.boulder.best */
    PUBLIC_PHOTO_URL_BASE: string;
  };
}

export {};
