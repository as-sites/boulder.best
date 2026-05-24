/* oxlint-disable eslint/no-console -- CLI script; env vars are injected by mise */
/**
 * Create Cloudflare API tokens for boulder.best:
 *
 * 1. Deploy token (`LOCAL_CLOUDFLARE_API_TOKEN`) — wrangler, CI, R2 bucket admin
 *    via API.
 * 2. R2 S3 credentials (`R2_*`) — presigned browser uploads via s3mini / S3 API.
 *
 * Expects CLOUDFLARE_MASTER_TOKEN (account-owned `cfat_*` token with permission
 * to create tokens), CLOUDFLARE_ACCOUNT_ID, and CLOUDFLARE_ZONE_ID in the
 * environment. Optional R2_BUCKET_NAME (default: boulder-dot-best).
 *
 * @see https://developers.cloudflare.com/fundamentals/api/how-to/create-via-api/
 * @see https://developers.cloudflare.com/r2/api/tokens/
 */

/// <reference types="node" />

import {
  buildR2BucketResource,
  deriveR2SecretAccessKey,
  toCloudflareTimestamp,
} from './lib/cloudflare-r2-token.ts';

const API_BASE = 'https://api.cloudflare.com/client/v4';
const DEPLOY_TOKEN_NAME = 'boulder.best deploy (mise)';
const R2_S3_TOKEN_NAME = 'boulder.best r2 s3 uploads (mise)';
const DEFAULT_R2_BUCKET = 'boulder-dot-best';

const PERMISSION_ALIASES = {
  account: [
    'Account Settings Read',
    'Workers Scripts Edit',
    'Workers Scripts Write',
    'Workers R2 Storage Edit',
    'Workers R2 Storage Write',
  ],
  zone: [
    'Workers Routes Edit',
    'Workers Routes Write',
    'DNS Edit',
    'DNS Write',
    'SSL and Certificates Edit',
    'SSL and Certificates Write',
    'Zone Read',
  ],
  r2BucketObjectWrite: ['Workers R2 Storage Bucket Item Write'],
} as const;

interface PermissionGroup {
  id: string;
  name: string;
  scopes: string[];
}

interface CfApiResponse<T = unknown> {
  success: boolean;
  errors?: Array<{ message: string }>;
  result?: T;
  result_info?: { page: number; total_pages: number };
}

interface CreateTokenResult {
  id: string;
  value: string;
}

interface TokenPolicy {
  effect: 'allow';
  resources: Record<string, string>;
  permission_groups: Array<{ id: string; name: string }>;
}

const requiredEnv = (name: string): string => {
  // oxlint-disable-next-line node/no-process-env
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
};

const optionalEnv = (name: string): string | undefined => {
  // oxlint-disable-next-line node/no-process-env
  const value = process.env[name]?.trim();
  return value || undefined;
};

const cfRequest = async <T>(
  token: string,
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<CfApiResponse<T>> => {
  const { method = 'GET', body } = options;
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await response.json()) as CfApiResponse<T>;
  if (!data.success) {
    const detail =
      data.errors?.map((e) => e.message).join('; ') ||
      `${response.status} ${response.statusText}`;
    throw new Error(`${method} ${path}: ${detail}`);
  }
  return data;
};

const listPermissionGroups = async (
  masterToken: string,
  accountId: string,
): Promise<PermissionGroup[]> => {
  const groups: PermissionGroup[] = [];
  let page = 1;
  // oxlint-disable-next-line typescript/no-unnecessary-condition -- paginate until break
  while (true) {
    const data = await cfRequest<PermissionGroup[]>(
      masterToken,
      `/accounts/${accountId}/tokens/permission_groups?page=${page}&per_page=100`,
    );
    groups.push(...(data.result ?? []));
    const { result_info: info } = data;
    if (!info || page >= info.total_pages) {
      break;
    }
    page += 1;
  }
  return groups;
};

const resolvePermissionGroup = (
  groups: PermissionGroup[],
  aliases: ReadonlyArray<string>,
  scope: string,
): { id: string; name: string } => {
  const wanted = new Set(aliases.map((a) => a.toLowerCase()));
  const matches = groups.filter(
    (g) =>
      wanted.has(g.name.toLowerCase()) &&
      g.scopes.some((s) => s === scope || s.startsWith(`${scope}.`)),
  );
  if (matches.length === 0) {
    throw new Error(
      `Could not find permission group for scope "${scope}" (${aliases.join(' / ')}).`,
    );
  }
  return { id: matches[0].id, name: matches[0].name };
};

const resolvePermissionGroupByName = (
  groups: PermissionGroup[],
  aliases: ReadonlyArray<string>,
): { id: string; name: string } => {
  const wanted = new Set(aliases.map((a) => a.toLowerCase()));
  const matches = groups.filter((g) => wanted.has(g.name.toLowerCase()));
  if (matches.length === 0) {
    throw new Error(
      `Could not find permission group (${aliases.join(' / ')}).`,
    );
  }
  const bucketScoped =
    matches.find((g) => g.scopes.some((s) => s.includes('edge.r2.bucket'))) ??
    matches[0];
  return { id: bucketScoped.id, name: bucketScoped.name };
};

const resolveUniquePermissions = (
  aliases: ReadonlyArray<string>,
  scope: string,
  groups: PermissionGroup[],
): Array<{ id: string; name: string }> => {
  const resolved: Array<{ id: string; name: string }> = [];
  const seen = new Set<string>();
  for (const alias of aliases) {
    const match = groups.find(
      (g) =>
        g.name.toLowerCase() === alias.toLowerCase() &&
        g.scopes.some((s) => s === scope || s.startsWith(`${scope}.`)),
    );
    if (!match || seen.has(match.id)) {
      continue;
    }
    seen.add(match.id);
    resolved.push({ id: match.id, name: match.name });
  }
  return resolved;
};

const printPermissionList = (
  heading: string,
  permissions: Array<{ name: string }>,
): void => {
  console.log(heading);
  for (const p of permissions) {
    console.log(`  - ${p.name}`);
  }
};

const createAccountToken = async ({
  masterToken,
  accountId,
  name,
  policies,
  expiresOn,
}: {
  masterToken: string;
  accountId: string;
  name: string;
  policies: TokenPolicy[];
  expiresOn: Date;
}): Promise<CreateTokenResult> => {
  const create = await cfRequest<CreateTokenResult>(
    masterToken,
    `/accounts/${accountId}/tokens`,
    {
      method: 'POST',
      body: {
        name,
        policies,
        expires_on: toCloudflareTimestamp(expiresOn),
      },
    },
  );

  const { id, value } = create.result ?? {};
  if (!id || !value) {
    throw new Error('Cloudflare API did not return a token id and value.');
  }

  return { id, value };
};

try {
  const masterToken = requiredEnv('CLOUDFLARE_MASTER_TOKEN');
  const accountId = requiredEnv('CLOUDFLARE_ACCOUNT_ID');
  const zoneId = requiredEnv('CLOUDFLARE_ZONE_ID');
  const r2BucketName = optionalEnv('R2_BUCKET_NAME') ?? DEFAULT_R2_BUCKET;

  await cfRequest(masterToken, `/accounts/${accountId}/tokens/verify`);

  const allGroups = await listPermissionGroups(masterToken, accountId);

  const accountScope = 'com.cloudflare.api.account';
  const zoneScope = 'com.cloudflare.api.account.zone';

  const accountPermissions = resolveUniquePermissions(
    PERMISSION_ALIASES.account,
    accountScope,
    allGroups,
  );
  const zonePermissions = resolveUniquePermissions(
    PERMISSION_ALIASES.zone,
    zoneScope,
    allGroups,
  );

  if (accountPermissions.length === 0) {
    throw new Error('No account-scoped permission groups resolved.');
  }
  if (zonePermissions.length === 0) {
    throw new Error('No zone-scoped permission groups resolved.');
  }

  resolvePermissionGroup(
    allGroups,
    ['Workers Scripts Edit', 'Workers Scripts Write'],
    accountScope,
  );
  resolvePermissionGroup(
    allGroups,
    ['Workers R2 Storage Edit', 'Workers R2 Storage Write'],
    accountScope,
  );
  resolvePermissionGroup(
    allGroups,
    ['Workers Routes Edit', 'Workers Routes Write'],
    zoneScope,
  );
  resolvePermissionGroup(allGroups, ['DNS Edit', 'DNS Write'], zoneScope);

  const r2ObjectWritePermission = resolvePermissionGroupByName(
    allGroups,
    PERMISSION_ALIASES.r2BucketObjectWrite,
  );

  const expiresOn = new Date();
  expiresOn.setUTCFullYear(expiresOn.getUTCFullYear() + 1);

  const deployPolicies: TokenPolicy[] = [
    {
      effect: 'allow',
      resources: { [`com.cloudflare.api.account.${accountId}`]: '*' },
      permission_groups: accountPermissions,
    },
    {
      effect: 'allow',
      resources: { [`com.cloudflare.api.account.zone.${zoneId}`]: '*' },
      permission_groups: zonePermissions,
    },
  ];

  const deployToken = await createAccountToken({
    masterToken,
    accountId,
    name: DEPLOY_TOKEN_NAME,
    policies: deployPolicies,
    expiresOn,
  });

  const r2BucketResource = buildR2BucketResource(accountId, r2BucketName);
  const r2Policies: TokenPolicy[] = [
    {
      effect: 'allow',
      resources: { [r2BucketResource]: '*' },
      permission_groups: [r2ObjectWritePermission],
    },
  ];

  const r2Token = await createAccountToken({
    masterToken,
    accountId,
    name: R2_S3_TOKEN_NAME,
    policies: r2Policies,
    expiresOn,
  });

  const r2SecretAccessKey = deriveR2SecretAccessKey(r2Token.value);

  console.log(
    `Created deploy API token "${DEPLOY_TOKEN_NAME}" (id: ${deployToken.id})`,
  );
  console.log(
    `Created R2 S3 API token "${R2_S3_TOKEN_NAME}" (id: ${r2Token.id})`,
  );
  console.log(`R2 bucket: ${r2BucketName} (${r2BucketResource})`);
  console.log(`Expires: ${toCloudflareTimestamp(expiresOn)}`);
  console.log('');
  printPermissionList('Deploy — account permissions:', accountPermissions);
  printPermissionList(
    'Deploy — zone permissions (boulder.best):',
    zonePermissions,
  );
  printPermissionList('R2 S3 — bucket permissions:', [r2ObjectWritePermission]);
  console.log('');
  console.log('Add to .env:');
  console.log(`LOCAL_CLOUDFLARE_API_TOKEN="${deployToken.value}"`);
  console.log(`R2_ACCOUNT_ID="${accountId}"`);
  console.log(`R2_ACCESS_KEY_ID="${r2Token.id}"`);
  console.log(`R2_SECRET_ACCESS_KEY="${r2SecretAccessKey}"`);
  console.log('');
  console.log(
    'R2_ACCESS_KEY_ID is the R2 token id; R2_SECRET_ACCESS_KEY is SHA-256 of the R2 token value (Cloudflare R2 S3 API).',
  );
  console.log('These values are shown once. Store them securely.');
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`error: ${message}`);
  process.exitCode = 1;
}
