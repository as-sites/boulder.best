/* oxlint-disable eslint/no-console -- CLI script; env vars are injected by mise */
/**
 * Push production API Worker secrets to Cloudflare from the local `.env`.
 *
 * Uses the Cloudflare Workers Scripts Secrets API (same target as `wrangler
 * secret put … --env production`).
 */

/// <reference types="node" />

import Cloudflare from 'cloudflare';
import {
  readProductionWorkerName,
  requiredEnv,
  resolveCloudflareApiToken,
  runScript,
} from './lib/secrets-utils.ts';

const WORKER_SECRETS = [
  'DATABASE_URL',
  'BETTER_AUTH_SECRET',
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'RESEND_API_KEY',
  'DISCORD_CLIENT_ID',
  'DISCORD_CLIENT_SECRET',
  'SENTRY_DSN_API',
] as const;

await runScript(async () => {
  const accountId = requiredEnv('CLOUDFLARE_ACCOUNT_ID');
  const apiToken = resolveCloudflareApiToken();
  const scriptName = await readProductionWorkerName();

  for (const name of WORKER_SECRETS) {
    requiredEnv(name);
  }

  const cloudflare = new Cloudflare({ apiToken });
  // Account-owned tokens (cfat_*) fail `/user/tokens/verify`; account lookup works for both.
  await cloudflare.accounts.get({ account_id: accountId });

  const secrets = Object.fromEntries(
    WORKER_SECRETS.map((name) => [
      name,
      {
        name,
        text: requiredEnv(name),
        type: 'secret_text' as const,
      },
    ]),
  );

  await cloudflare.workers.scripts.secrets.bulkUpdate(scriptName, {
    account_id: accountId,
    secrets,
  });

  for (const name of WORKER_SECRETS) {
    console.log(`Set Worker secret ${name} on ${scriptName}`);
  }
});
