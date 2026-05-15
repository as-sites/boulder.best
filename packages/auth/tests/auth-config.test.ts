import { describe, expect, it } from 'vitest';
import type { AuthEnvBindings, AuthServer } from '../src/index.js';

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
    expect(env.RESEND_API_KEY).toBeUndefined();
  });

  it('accepts all optional provider fields when present', () => {
    const env: AuthEnvBindings = {
      BETTER_AUTH_SECRET: 'x'.repeat(32),
      BETTER_AUTH_URL: 'https://api.boulder.best',
      FRONTEND_URL: 'https://boulder.best',
      DATABASE_URL: 'postgresql://user:pass@host/db',
      RESEND_API_KEY: 're_test_key',
      GOOGLE_CLIENT_ID: 'google-id',
      GOOGLE_CLIENT_SECRET: 'google-secret',
      DISCORD_CLIENT_ID: 'discord-id',
      DISCORD_CLIENT_SECRET: 'discord-secret',
      PASSKEY_RP_ID: 'boulder.best',
    };
    expect(env.GOOGLE_CLIENT_ID).toBe('google-id');
    expect(env.PASSKEY_RP_ID).toBe('boulder.best');
  });
});

describe('auth server interface', () => {
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
