import * as Sentry from '@sentry/react';

const OFFLINE_ERROR_PATTERNS = [
  /^Failed to fetch$/i,
  /^Network Error$/i,
  /^Load failed$/i,
  /^NetworkError when attempting to fetch resource\.?$/i,
];

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
    ignoreErrors: OFFLINE_ERROR_PATTERNS,
  });
};
