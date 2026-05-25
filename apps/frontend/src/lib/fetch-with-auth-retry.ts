import { authClient } from './auth-client.js';

/**
 * Fetch wrapper for Hono RPC: on 401, revalidate the Better Auth session once
 * (bypassing cookie cache) and retry the original request exactly once.
 */
export const fetchWithAuthRetry: typeof fetch = async (input, init) => {
  const response = await globalThis.fetch(input, init);

  if (response.status !== 401) {
    return response;
  }

  const sessionResult = await authClient.getSession({
    query: { disableCookieCache: true },
  });

  if (!sessionResult.data?.user) {
    return response;
  }

  return await globalThis.fetch(input, init);
};
