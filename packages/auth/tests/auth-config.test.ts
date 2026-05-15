import { describe, expect, it } from 'vitest';
import {
  createAuth,
  createAuthProviderConfig,
  type AuthEnvBindings,
  type AuthServer,
} from '../src/index.js';

// Compile-time fixture: verifies the public interface shapes without
// instantiating better-auth or touching any database.

describe('auth env bindings', () => {
  it('accepts only the four core fields — optional fields may be absent', () => {
    // If any optional field were required, TypeScript would reject this object.
    const env: AuthEnvBindings = {
      BETTER_AUTH_SECRET: 'x'.repeat(32),
      BETTER_AUTH_URL: 'http://localhost:8787',
      FRONTEND_URL: 'http://localhost:5173',
      DATABASE_URL: 'postgresql://user:pass@host/db',
    };
    expect(env.BETTER_AUTH_SECRET).toHaveLength(32);
    expect(env.GOOGLE_CLIENT_ID).toBeUndefined();
    expect(env.DISCORD_CLIENT_ID).toBeUndefined();
    expect(env.PASSKEY_RP_ID).toBeUndefined();
    expect(env.PASSKEY_ORIGIN).toBeUndefined();
    expect(env.RESEND_API_KEY).toBeUndefined();
  });

  it('accepts all optional provider fields when present', () => {
    const env: AuthEnvBindings = {
      BETTER_AUTH_SECRET: 'x'.repeat(32),
      BETTER_AUTH_URL: 'https://boulder.best',
      FRONTEND_URL: 'https://boulder.best',
      DATABASE_URL: 'postgresql://user:pass@host/db',
      RESEND_API_KEY: 're_test_key',
      GOOGLE_CLIENT_ID: 'google-id',
      GOOGLE_CLIENT_SECRET: 'google-secret',
      DISCORD_CLIENT_ID: 'discord-id',
      DISCORD_CLIENT_SECRET: 'discord-secret',
      PASSKEY_RP_ID: 'boulder.best',
      PASSKEY_ORIGIN: 'https://boulder.best',
    };
    expect(env.GOOGLE_CLIENT_ID).toBe('google-id');
    expect(env.PASSKEY_RP_ID).toBe('boulder.best');
  });
});

describe('auth provider config', () => {
  const baseEnv = {
    BETTER_AUTH_SECRET: 'x'.repeat(32),
    BETTER_AUTH_URL: 'https://boulder.best',
    FRONTEND_URL: 'https://boulder.best',
    DATABASE_URL: 'postgresql://user:pass@host/db',
  } satisfies AuthEnvBindings;

  it('keeps provider config empty for the email/password baseline', () => {
    expect(createAuthProviderConfig(baseEnv)).toEqual({
      socialProviders: {},
    });
  });

  it('enables Google, Discord, and passkey when complete env is present', () => {
    expect(
      createAuthProviderConfig({
        ...baseEnv,
        GOOGLE_CLIENT_ID: 'google-id',
        GOOGLE_CLIENT_SECRET: 'google-secret',
        DISCORD_CLIENT_ID: 'discord-id',
        DISCORD_CLIENT_SECRET: 'discord-secret',
        PASSKEY_RP_ID: 'boulder.best',
        PASSKEY_ORIGIN: 'https://boulder.best',
      }),
    ).toEqual({
      socialProviders: {
        google: {
          clientId: 'google-id',
          clientSecret: 'google-secret',
        },
        discord: {
          clientId: 'discord-id',
          clientSecret: 'discord-secret',
        },
      },
      passkey: {
        rpID: 'boulder.best',
        rpName: 'Boulder.best',
        origin: 'https://boulder.best',
      },
    });
  });

  it('uses BETTER_AUTH_URL as the passkey origin when no override is set', () => {
    expect(
      createAuthProviderConfig({
        ...baseEnv,
        PASSKEY_RP_ID: 'boulder.best',
      }).passkey,
    ).toEqual({
      rpID: 'boulder.best',
      rpName: 'Boulder.best',
      origin: 'https://boulder.best',
    });
  });

  it('rejects partial OAuth provider credentials', () => {
    expect(() =>
      createAuthProviderConfig({
        ...baseEnv,
        GOOGLE_CLIENT_ID: 'google-id',
      }),
    ).toThrow('Google OAuth requires both client ID and client secret');

    expect(() =>
      createAuthProviderConfig({
        ...baseEnv,
        DISCORD_CLIENT_SECRET: 'discord-secret',
      }),
    ).toThrow('Discord OAuth requires both client ID and client secret');
  });

  it('rejects invalid passkey RP ID and origin values', () => {
    expect(() =>
      createAuthProviderConfig({
        ...baseEnv,
        PASSKEY_RP_ID: 'https://boulder.best',
      }),
    ).toThrow('PASSKEY_RP_ID must be a domain-style RP ID');

    expect(() =>
      createAuthProviderConfig({
        ...baseEnv,
        PASSKEY_RP_ID: 'boulder.best',
        PASSKEY_ORIGIN: 'https://boulder.best/',
      }),
    ).toThrow('PASSKEY_ORIGIN must be an origin URL without a trailing slash');
  });
});

describe('auth server interface', () => {
  it('reports missing required env bindings before creating database clients', () => {
    expect(() =>
      createAuth({
        BETTER_AUTH_SECRET: 'x'.repeat(32),
        BETTER_AUTH_URL: 'http://localhost:8787',
        FRONTEND_URL: 'http://localhost:5173',
        DATABASE_URL: '',
      }),
    ).toThrow('Missing required auth environment binding(s): DATABASE_URL');
  });

  it('exposes a handler method accepting a Request', () => {
    // Type-level assertion: a handler conforming to the interface must compile.
    type HandlerFn = AuthServer['handler'];
    type _Check = HandlerFn extends (
      req: Request,
    ) => Response | Promise<Response>
      ? true
      : never;
    const _verified: _Check = true;
    expect(_verified).toBe(true);
  });
});
