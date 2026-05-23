export interface ApiSentryOptions {
  dsn: string;
  release?: string;
  tracesSampleRate: number;
}

export const createApiSentryOptions = (
  env: CloudflareBindings | undefined,
): ApiSentryOptions | undefined => {
  if (!env?.SENTRY_DSN_API) {
    return undefined;
  }

  return {
    dsn: env.SENTRY_DSN_API,
    ...(env.SENTRY_RELEASE_API ? { release: env.SENTRY_RELEASE_API } : {}),
    tracesSampleRate: 0,
  };
};
