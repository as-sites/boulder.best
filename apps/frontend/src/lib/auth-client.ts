import { passkeyClient } from '@better-auth/passkey/client';
import { createAuthClient } from 'better-auth/react';

type AuthActionResult = Promise<{
  data?: unknown;
  error?: { message?: string | undefined } | null;
}>;

export type OAuthProvider = 'google' | 'discord';

// createAuthClient's inferred return type references better-auth internal dist
// paths that TypeScript composite emit considers non-portable (TS2883).
// The explicit interface covers everything components actually use.
export interface AuthClient {
  signIn: ReturnType<typeof createAuthClient>['signIn'] & {
    email(options: { email: string; password: string }): AuthActionResult;
    passkey(options: { autoFill?: boolean }): AuthActionResult;
    social(options: {
      provider: OAuthProvider;
      callbackURL?: string;
    }): AuthActionResult;
  };
  signUp: ReturnType<typeof createAuthClient>['signUp'] & {
    email(options: {
      email: string;
      password: string;
      name: string;
    }): AuthActionResult;
  };
  signOut(): AuthActionResult;
  useSession: ReturnType<typeof createAuthClient>['useSession'];
  getSession: ReturnType<typeof createAuthClient>['getSession'];
  passkey: {
    addPasskey(options: {
      name?: string;
      authenticatorAttachment?: 'platform' | 'cross-platform';
    }): AuthActionResult;
  };
}

const _client = createAuthClient({
  // Empty in dev — Vite proxy forwards /api to localhost:8787.
  // Leave empty in production when the API Worker is routed at /api on the same origin.
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  plugins: [passkeyClient()],
  sessionOptions: {
    refetchOnWindowFocus: true,
  },
});

export const authClient = _client as unknown as AuthClient;
