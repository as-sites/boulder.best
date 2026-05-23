/* oxlint-disable eslint/no-console -- CLI script; env vars are injected by mise */
/**
 * Create a scoped Cloudflare API token for boulder.best wrangler/CI workflows.
 *
 * Expects CLOUDFLARE_MASTER_TOKEN (account-owned `cfat_*` token with permission
 * to create tokens), CLOUDFLARE_ACCOUNT_ID, and CLOUDFLARE_ZONE_ID in the
 * environment.
 *
 * @see https://developers.cloudflare.com/fundamentals/api/get-started/account-owned-tokens/
 * @see https://developers.cloudflare.com/fundamentals/api/how-to/create-via-api/
 */

/// <reference types="node" />

const API_BASE = 'https://api.cloudflare.com/client/v4';
const TOKEN_NAME = 'boulder.best deploy (mise)';

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

/** Cloudflare expects UTC timestamps without fractional seconds. */
const toCloudflareTimestamp = (date: Date): string =>
  date.toISOString().replace(/\.\d{3}Z$/, 'Z');

const requiredEnv = (name: string): string => {
  // oxlint-disable-next-line node/no-process-env
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
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

try {
  const masterToken = requiredEnv('CLOUDFLARE_MASTER_TOKEN');
  const accountId = requiredEnv('CLOUDFLARE_ACCOUNT_ID');
  const zoneId = requiredEnv('CLOUDFLARE_ZONE_ID');

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

  const expiresOn = new Date();
  expiresOn.setUTCFullYear(expiresOn.getUTCFullYear() + 1);

  const policies = [
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

  const create = await cfRequest<CreateTokenResult>(
    masterToken,
    `/accounts/${accountId}/tokens`,
    {
      method: 'POST',
      body: {
        name: TOKEN_NAME,
        policies,
        expires_on: toCloudflareTimestamp(expiresOn),
      },
    },
  );

  const { id: tokenId, value: tokenValue } = create.result ?? {};
  if (!tokenId || !tokenValue) {
    throw new Error('Cloudflare API did not return a token id and value.');
  }

  console.log(`Created API token "${TOKEN_NAME}" (id: ${tokenId})`);
  console.log(`Expires: ${toCloudflareTimestamp(expiresOn)}`);
  console.log('');
  printPermissionList('Account permissions:', accountPermissions);
  printPermissionList('Zone permissions (boulder.best):', zonePermissions);
  console.log('');
  console.log('Add to .env for wrangler and mise run secrets:sync:github:');
  console.log(`LOCAL_CLOUDFLARE_API_TOKEN="${tokenValue}"`);
  console.log('');
  console.log('This value is shown once. Store it securely.');
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`error: ${message}`);
  process.exitCode = 1;
}

// so typescript treats this as a module
// oxlint-disable-next-line unicorn/require-module-specifiers
export {};
