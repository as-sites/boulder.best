/* oxlint-disable eslint/no-console -- CLI script; env vars are injected by mise */
/**
 * Push repository secrets to GitHub Actions from the local `.env`.
 *
 * Requires GitHub auth via GITHUB_TOKEN or `gh auth login`.
 */

/// <reference types="node" />

import sodium from 'libsodium-wrappers';
import { Octokit } from 'octokit';
import {
  requiredEnv,
  resolveGitHubRepo,
  resolveGitHubToken,
  runScript,
} from './lib/secrets-utils.ts';

const GITHUB_SECRETS: Array<[secretName: string, envName?: string]> = [
  ['CLOUDFLARE_API_TOKEN', 'LOCAL_CLOUDFLARE_API_TOKEN'],
  ['CLOUDFLARE_ACCOUNT_ID'],
  ['CLOUDFLARE_ZONE_ID'],
  ['DATABASE_URL'],
  ['VITE_SENTRY_DSN_FRONTEND'],
  ['SENTRY_AUTH_TOKEN'],
  ['SENTRY_ORG'],
  ['SENTRY_PROJECT_FRONTEND'],
  ['SENTRY_PROJECT_API'],
  ['SENTRY_DSN_API'],
];

const encryptSecret = async (
  secret: string,
  publicKey: string,
): Promise<string> => {
  // oxlint-disable-next-line import/no-named-as-default-member
  await sodium.ready;
  const messageBytes = Buffer.from(secret);
  const keyBytes = Buffer.from(publicKey, 'base64');
  const encryptedBytes = sodium.crypto_box_seal(messageBytes, keyBytes);
  return Buffer.from(encryptedBytes).toString('base64');
};

await runScript(async () => {
  GITHUB_SECRETS.forEach(([secretName, envName = secretName]) => {
    requiredEnv(envName);
  });

  const octokit = new Octokit({ auth: resolveGitHubToken() });
  const { owner, repo } = resolveGitHubRepo();
  const { data: publicKey } = await octokit.rest.actions.getRepoPublicKey({
    owner,
    repo,
  });

  await Promise.all(
    GITHUB_SECRETS.map(async ([secretName, envName = secretName]) => {
      const value = requiredEnv(envName);
      const encryptedValue = await encryptSecret(value, publicKey.key);
      await octokit.rest.actions.createOrUpdateRepoSecret({
        owner,
        repo,
        secret_name: secretName,
        encrypted_value: encryptedValue,
        key_id: publicKey.key_id,
      });
      console.log(`Set GitHub secret ${secretName}`);
    }),
  );
});
