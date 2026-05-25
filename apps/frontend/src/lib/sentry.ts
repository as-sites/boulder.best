import * as Sentry from '@sentry/react';
import { OFFLINE_ERROR_IGNORE_PATTERNS } from './fetch-error.js';

const { VITE_SENTRY_DSN_FRONTEND: dsn, VITE_SENTRY_RELEASE_FRONTEND: release } =
  import.meta.env;

export const initSentry = (): void => {
  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    ...(release ? { release } : {}),
    tracesSampleRate: 0,
    ignoreErrors: OFFLINE_ERROR_IGNORE_PATTERNS,
  });
};
