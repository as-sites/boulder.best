// oxlint-disable eslint/no-console
import process from 'node:process';

const frontendOrigin = normalizeOrigin(
  process.env.FRONTEND_ORIGIN ?? 'https://boulder.best',
);
const apiOrigin = normalizeOrigin(process.env.API_ORIGIN ?? frontendOrigin);
const apiBasePath = normalizePath(process.env.API_BASE_PATH ?? '/api');

const checks = [
  {
    name: 'frontend shell',
    url: `${frontendOrigin}/`,
    validate: async (response) => {
      if (!response.ok) {
        throw new Error(`expected 2xx, got ${response.status}`);
      }

      const body = await response.text();

      if (!body.includes('<div id="root"')) {
        throw new Error('response did not look like the Vite app shell');
      }
    },
  },
  {
    name: 'API health',
    url: `${apiOrigin}${apiBasePath}/health`,
    validate: async (response) => {
      if (!response.ok) {
        throw new Error(`expected 2xx, got ${response.status}`);
      }

      const body = await response.json();

      if (body?.ok !== true) {
        throw new Error('health response did not include { ok: true }');
      }
    },
  },
  {
    name: 'auth session reachability',
    url: `${apiOrigin}${apiBasePath}/auth/session`,
    // oxlint-disable-next-line typescript/require-await
    validate: async (response) => {
      if (response.status >= 500) {
        throw new Error(`expected non-5xx, got ${response.status}`);
      }
    },
  },
];

let failed = false;

for (const check of checks) {
  try {
    const response = await fetch(check.url, {
      headers: { accept: 'application/json,text/html;q=0.9,*/*;q=0.8' },
    });

    await check.validate(response);
    console.log(`ok - ${check.name}: ${check.url}`);
  } catch (error) {
    failed = true;
    console.error(`not ok - ${check.name}: ${check.url}\n  ${error.message}`);
  }
}

if (failed) {
  process.exitCode = 1;
}

function normalizeOrigin(value) {
  return value.replace(/\/+$/, '');
}

function normalizePath(value) {
  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`;
  return withLeadingSlash.replace(/\/+$/, '');
}
