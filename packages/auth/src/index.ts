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
  // Optional — set in Worker secrets / .dev.vars when the feature is enabled
  RESEND_API_KEY?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  DISCORD_CLIENT_ID?: string;
  DISCORD_CLIENT_SECRET?: string;
  PASSKEY_RP_ID?: string;
}

// Minimal surface exposed to apps — only what the Hono handler needs.
// Hiding the full betterAuth return type keeps declaration emit free of
// non-portable pnpm store paths (zod internals, @simplewebauthn, etc.).
export interface AuthServer {
  handler(request: Request): Response | Promise<Response>;
}

function buildAuth(env: AuthEnvBindings): AuthServer {
  const sql = neon(env.DATABASE_URL);
  const db = drizzle({ client: sql, schema: authSchema });

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
    socialProviders: {
      ...(env.GOOGLE_CLIENT_ID &&
        env.GOOGLE_CLIENT_SECRET && {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          },
        }),
      ...(env.DISCORD_CLIENT_ID &&
        env.DISCORD_CLIENT_SECRET && {
          discord: {
            clientId: env.DISCORD_CLIENT_ID,
            clientSecret: env.DISCORD_CLIENT_SECRET,
          },
        }),
    },
    plugins: env.PASSKEY_RP_ID
      ? [passkey({ rpID: env.PASSKEY_RP_ID, rpName: 'Boulder.best' })]
      : [],
    account: {
      accountLinking: {
        enabled: true,
      },
    },
  }) as unknown as AuthServer;
}

// Module-level cache — valid within a CF Worker isolate (shared across requests in the same instance)
let _auth: AuthServer | null = null;
let _cacheKey: string | null = null;

export function createAuth(env: AuthEnvBindings): AuthServer {
  if (_auth !== null && _cacheKey === env.BETTER_AUTH_SECRET) {
    return _auth;
  }
  _auth = buildAuth(env);
  _cacheKey = env.BETTER_AUTH_SECRET;
  return _auth;
}

export * from './schema.js';
