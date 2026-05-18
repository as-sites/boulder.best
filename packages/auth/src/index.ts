import { passkey } from '@better-auth/passkey';
import { neon } from '@neondatabase/serverless';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from 'drizzle-orm/neon-http';
import { Resend } from 'resend';
import * as authSchema from './schema.js';

export interface AuthEnvBindings {
  // Core — required at all times
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  FRONTEND_URL: string;
  DATABASE_URL: string;
  // Optional — set in Worker secrets or local .env when the feature is enabled
  RESEND_API_KEY?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  DISCORD_CLIENT_ID?: string;
  DISCORD_CLIENT_SECRET?: string;
  PASSKEY_RP_ID?: string;
  PASSKEY_ORIGIN?: string;
}

// Minimal surface exposed to apps — only what the API auth boundary needs.
// Hiding the full betterAuth return type keeps declaration emit free of
// non-portable pnpm store paths (zod internals, @simplewebauthn, etc.).
export interface AuthServer {
  handler(request: Request): Response | Promise<Response>;
  api: {
    getSession(options: { headers: Headers }): Promise<AuthSession | null>;
  };
}

export interface AuthSession {
  user: {
    id: string;
  };
  session: unknown;
}

export interface OAuthProviderConfig {
  clientId: string;
  clientSecret: string;
}

export interface PasskeyProviderConfig {
  rpID: string;
  rpName: string;
  origin: string;
}

export interface AuthProviderConfig {
  socialProviders: {
    google?: OAuthProviderConfig;
    discord?: OAuthProviderConfig;
  };
  passkey?: PasskeyProviderConfig;
}

const requiredAuthEnvKeys = [
  'BETTER_AUTH_SECRET',
  'BETTER_AUTH_URL',
  'FRONTEND_URL',
  'DATABASE_URL',
] as const satisfies ReadonlyArray<keyof AuthEnvBindings>;

const hasValue = (value: string | undefined): value is string =>
  value !== undefined && value.length > 0;

const assertAuthEnv = (env: AuthEnvBindings): void => {
  const missing = requiredAuthEnvKeys.filter((key) => !hasValue(env[key]));

  if (missing.length > 0) {
    throw new Error(
      `Missing required auth environment binding(s): ${missing.join(
        ', ',
      )}. Declare required secret names in the API Wrangler config and provide local values in .env or Cloudflare Worker secrets.`,
    );
  }
};

const providerPair = (
  provider: 'Google' | 'Discord',
  clientId: string | undefined,
  clientSecret: string | undefined,
): OAuthProviderConfig | undefined => {
  const hasClientId = hasValue(clientId);
  const hasClientSecret = hasValue(clientSecret);

  if (hasClientId !== hasClientSecret) {
    throw new Error(
      `${provider} OAuth requires both client ID and client secret when enabled.`,
    );
  }

  return hasClientId && hasClientSecret
    ? { clientId, clientSecret }
    : undefined;
};

const assertOrigin = (value: string, name: string): string => {
  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid URL origin.`);
  }

  if (parsed.origin !== value || value.endsWith('/')) {
    throw new Error(`${name} must be an origin URL without a trailing slash.`);
  }

  return value;
};

const assertRpId = (value: string): string => {
  if (value.includes('://') || value.includes('/') || value.endsWith('.')) {
    throw new Error('PASSKEY_RP_ID must be a domain-style RP ID, not a URL.');
  }

  return value;
};

export const createAuthProviderConfig = (
  env: AuthEnvBindings,
): AuthProviderConfig => {
  const google = providerPair(
    'Google',
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
  );
  const discord = providerPair(
    'Discord',
    env.DISCORD_CLIENT_ID,
    env.DISCORD_CLIENT_SECRET,
  );
  const passkeyOptions = hasValue(env.PASSKEY_RP_ID)
    ? {
        rpID: assertRpId(env.PASSKEY_RP_ID),
        rpName: 'Boulder.best',
        origin: assertOrigin(
          env.PASSKEY_ORIGIN ?? env.BETTER_AUTH_URL,
          env.PASSKEY_ORIGIN ? 'PASSKEY_ORIGIN' : 'BETTER_AUTH_URL',
        ),
      }
    : undefined;

  return {
    socialProviders: {
      ...(google && { google }),
      ...(discord && { discord }),
    },
    ...(passkeyOptions && { passkey: passkeyOptions }),
  };
};

const createAuthCacheKey = (env: AuthEnvBindings): string =>
  JSON.stringify({
    secret: env.BETTER_AUTH_SECRET,
    url: env.BETTER_AUTH_URL,
    frontendUrl: env.FRONTEND_URL,
    databaseUrl: env.DATABASE_URL,
    resendApiKey: env.RESEND_API_KEY,
    googleClientId: env.GOOGLE_CLIENT_ID,
    googleClientSecret: env.GOOGLE_CLIENT_SECRET,
    discordClientId: env.DISCORD_CLIENT_ID,
    discordClientSecret: env.DISCORD_CLIENT_SECRET,
    passkeyRpId: env.PASSKEY_RP_ID,
    passkeyOrigin: env.PASSKEY_ORIGIN,
  });

const buildAuth = (env: AuthEnvBindings): AuthServer => {
  const sql = neon(env.DATABASE_URL);
  const db = drizzle({ client: sql, schema: authSchema });
  const providerConfig = createAuthProviderConfig(env);

  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.FRONTEND_URL],
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: authSchema,
    }),
    emailAndPassword: {
      enabled: true,
      // Only wire up reset emails when the Resend key is present.
      // ctx.waitUntil should be used here once ExecutionContext is threaded
      // through the Hono handler so email I/O doesn't block the response.
      ...(env.RESEND_API_KEY && {
        sendResetPassword: async ({ user, url }) => {
          await new Resend(env.RESEND_API_KEY).emails.send({
            from: 'Boulder.best <noreply@boulder.best>',
            to: user.email,
            subject: 'Reset your password',
            html: `<p><a href="${url}">Click here</a> to reset your password. This link expires in 1 hour.</p>`,
          });
        },
      }),
    },
    socialProviders: providerConfig.socialProviders,
    plugins: providerConfig.passkey ? [passkey(providerConfig.passkey)] : [],
    account: {
      accountLinking: {
        enabled: true,
      },
    },
  }) as unknown as AuthServer;
};

// Module-level cache — valid within a CF Worker isolate (shared across requests in the same instance)
let _auth: AuthServer | null = null;
let _cacheKey: string | null = null;

export const createAuth = (env: AuthEnvBindings): AuthServer => {
  assertAuthEnv(env);
  const cacheKey = createAuthCacheKey(env);

  if (_auth !== null && _cacheKey === cacheKey) {
    return _auth;
  }
  _auth = buildAuth(env);
  _cacheKey = cacheKey;
  return _auth;
};

export * from './schema.js';
