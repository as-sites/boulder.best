/* oxlint-disable eslint/no-console -- CLI utilities; env vars are injected by mise */
/// <reference types="node" />

import { execSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse as parseJsonc } from 'jsonc-parser';

export const requiredEnv = (name: string): string => {
  // oxlint-disable-next-line node/no-process-env
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
};

export const resolveGitHubToken = (): string => {
  // oxlint-disable-next-line node/no-process-env
  const fromEnv = process.env.GITHUB_TOKEN?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  try {
    return execSync('gh auth token', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch {
    throw new Error(
      'GitHub auth failed: set GITHUB_TOKEN or run `gh auth login`.',
    );
  }
};

export const resolveGitHubRepo = (): { owner: string; repo: string } => {
  // oxlint-disable-next-line node/no-process-env
  const fromActions = process.env.GITHUB_REPOSITORY?.trim();
  if (fromActions) {
    const [owner, repo] = fromActions.split('/');
    if (owner && repo) {
      return { owner, repo };
    }
  }

  const remote = execSync('git remote get-url origin', {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
  const match = remote.match(/github\.com[:/]([^/]+)\/(.+?)(?:\.git)?$/);
  if (!match) {
    throw new Error(
      `Could not parse GitHub owner/repo from git remote: ${remote}`,
    );
  }
  return { owner: match[1], repo: match[2] };
};

export const resolveCloudflareApiToken = (): string =>
  requiredEnv('LOCAL_CLOUDFLARE_API_TOKEN');

export const readProductionWorkerName = async (): Promise<string> => {
  const configPath = join(import.meta.dirname, '../../apps/api/wrangler.jsonc');
  const raw = await readFile(configPath, 'utf8');
  const config = parseJsonc(raw) as {
    env?: { production?: { name?: string } };
  };
  const name = config.env?.production?.name?.trim();
  if (!name) {
    throw new Error(`Could not read env.production.name from ${configPath}.`);
  }
  return name;
};

export const runScript = async (main: () => Promise<void>): Promise<void> => {
  try {
    await main();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`error: ${message}`);
    process.exitCode = 1;
  }
};
