import * as Sentry from '@sentry/react';

const OFFLINE_ERROR_PATTERNS = [
  /^Failed to fetch$/i,
  /^Network Error$/i,
  /^Load failed$/i,
  /^NetworkError when attempting to fetch resource\.?$/i,
];

const dsn = import.meta.env.VITE_SENTRY_DSN;

export const initSentry = (): void => {
  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    tracesSampleRate: 0,
    ignoreErrors: OFFLINE_ERROR_PATTERNS,
  });
};
