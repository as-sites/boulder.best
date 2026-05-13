import { createAuthClient } from 'better-auth/react';

// createAuthClient's inferred return type references better-auth internal dist
// paths that TypeScript composite emit considers non-portable (TS2883).
// The explicit interface covers everything components actually use.
export interface AuthClient {
  signIn: ReturnType<typeof createAuthClient>['signIn'];
  signUp: ReturnType<typeof createAuthClient>['signUp'];
  signOut: ReturnType<typeof createAuthClient>['signOut'];
  useSession: ReturnType<typeof createAuthClient>['useSession'];
  getSession: ReturnType<typeof createAuthClient>['getSession'];
}

const _client = createAuthClient({
  // Empty in dev — Vite proxy forwards /api to localhost:8787.
  // Set VITE_API_BASE_URL to the production API URL (e.g. https://api.boulder.best) in prod.
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
});

export const authClient: AuthClient = _client;
