# Deployment

This app deploys to Cloudflare Workers. The frontend is a Workers Static Assets
SPA, and the API is a separate Worker routed under `https://boulder.best/api/*`.
Keep deployment commands in mise tasks; do not add package.json scripts.

## Cloudflare account setup

Workers are created on first deploy. Wrangler resolves the target account from
`CLOUDFLARE_ACCOUNT_ID` (recommended) or your logged-in default account.

**Local:** add to the repo root `.env` (see `.env.example`), or run
`wrangler login` and `wrangler whoami`.

To mint deploy + R2 S3 credentials (Workers, Routes, DNS, presigned uploads):

```powershell
# .env.secret: CLOUDFLARE_MASTER_TOKEN (account-owned cfat_* token from Account API Tokens)
# .env: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_ZONE_ID
mise run cloudflare:token:create
```

Copy the printed values into `.env`:

- `LOCAL_CLOUDFLARE_API_TOKEN` — wrangler / CI
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` — presigned photo uploads (do **not** reuse the deploy token)

**CI:** set the `CLOUDFLARE_ACCOUNT_ID` repository secret (see `.github/workflows/deploy.yml`).

```powershell
wrangler login   # optional if CLOUDFLARE_ACCOUNT_ID is in .env
wrangler whoami
```

### Workers and R2

| Resource                     | Name                 | Notes                                                                                   |
| ---------------------------- | -------------------- | --------------------------------------------------------------------------------------- |
| API Worker (production)      | `boulder-api`        | Route `boulder.best/api/*`                                                              |
| Frontend Worker (production) | `boulder-frontend`   | Custom domain `boulder.best` (DNS managed on deploy)                                    |
| API Worker route             | `boulder.best/api/*` | Zone route; takes precedence over the frontend domain                                   |
| R2                           | `boulder-dot-best`   | Bound as `MEDIA_BUCKET`; public URL `cdn.boulder.best` (local dev uses the same bucket) |

The frontend uses a **custom domain** on `boulder.best` (Wrangler creates apex DNS
and TLS). The API keeps a **zone route** on `boulder.best/api/*`, which is more
specific, so `/api/*` still hits `boulder-api`.

If you previously created manual apex DNS for `boulder.best`, delete that record
before the first custom-domain frontend deploy (Wrangler cannot attach while a
conflicting CNAME exists). `cdn.boulder.best` is separate R2 public access — see
[R2 custom domain](#r2-custom-domain) below.

## Frontend Worker

`apps/frontend/wrangler.jsonc` serves `./dist` with
`not_found_handling` set to `single-page-application`. That keeps TanStack
Router browser routes working when a user refreshes a nested URL.

The frontend uses `@cloudflare/vite-plugin`, which bakes the active Cloudflare
environment into `dist/wrangler.json` at build time. `frontend:build` sets
`CLOUDFLARE_ENV=production` via `apps/frontend/mise.toml` (and optionally in CI).
Deploy
with `wrangler deploy` from `apps/frontend` after a production build — do not
pass `--env`; the generated config already targets production.

Use:

```powershell
mise run frontend:build
mise run frontend:deploy:dry-run
mise run frontend:deploy
```

The production frontend defaults to same-origin API/auth calls. Only set
`VITE_API_BASE_URL` for preview environments that intentionally call a different
API origin.

### Sentry (optional)

Production builds emit browser source maps. When CI secrets are set, the deploy
workflow uploads them with `frontend:sentry:sourcemaps` (sentry-cli). To upload
during `frontend:build` locally instead, set `SENTRY_UPLOAD_SOURCEMAPS=1` (see
`.github/workflows/deploy.yml`).

| Variable                       | Where              | Purpose                                    |
| ------------------------------ | ------------------ | ------------------------------------------ |
| `VITE_SENTRY_DSN_FRONTEND`     | CI secret → build  | Enables the browser SDK                    |
| `VITE_SENTRY_RELEASE_FRONTEND` | CI (`GITHUB_SHA`)  | Frontend release id; must match map upload |
| `SENTRY_AUTH_TOKEN`            | CI secret → deploy | Uploads source maps (frontend + API)       |
| `SENTRY_ORG`                   | CI secret → build  | Organization slug                          |
| `SENTRY_PROJECT_FRONTEND`      | CI secret → build  | Frontend project slug                      |
| `SENTRY_PROJECT_API`           | CI secret → deploy | API project slug (source map upload)       |
| `SENTRY_DSN_API`               | Worker secret      | API runtime DSN (`wrangler secret put`)    |
| `SENTRY_RELEASE_API`           | CI (`GITHUB_SHA`)  | API release id for maps + runtime events   |

Set the same values in the repo root `.env` to test uploads locally with
`mise run frontend:sentry:sourcemaps` (after `frontend:build`), or set
`SENTRY_UPLOAD_SOURCEMAPS=1` to upload during `frontend:build` via
`@sentry/vite-plugin`. For the API,
use `mise run api:deploy` then `mise run api:sentry:sourcemaps`.

The API uses [`@sentry/hono`](https://docs.sentry.io/platforms/javascript/guides/hono/)
on Cloudflare Workers (`nodejs_compat` is already enabled). Production deploys set
`upload_source_maps` in `apps/api/wrangler.jsonc` and upload artifacts after deploy.

## API Worker

`apps/api/wrangler.jsonc` defines the production route
`boulder.best/api/*`. The Worker exposes `/api/health` for deployed smoke
checks and `/api/auth/*` for better-auth.

Required production secrets:

```text
DATABASE_URL
BETTER_AUTH_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
RESEND_API_KEY
DISCORD_CLIENT_ID
DISCORD_CLIENT_SECRET
SENTRY_DSN_API
```

GitHub Actions repository secrets for Discord notifications:

```text
DISCORD_DEPLOY_WEBHOOK_URL    # deploy workflow failures
DISCORD_PR_MERGE_WEBHOOK_URL  # PR merged into main
```

Required non-secret production vars:

```text
BETTER_AUTH_URL=https://boulder.best
FRONTEND_URL=https://boulder.best
PASSKEY_RP_ID=boulder.best
PASSKEY_ORIGIN=https://boulder.best
PUBLIC_PHOTO_URL_BASE=https://cdn.boulder.best
```

Fill in the repo root `.env` (see `.env.example`), then sync secrets from your
machine (mise loads `.env` automatically). `secrets:sync:github` pushes
`CLOUDFLARE_ZONE_ID` (for deploy `api:r2:sync`) along with other CI secrets:

```powershell
mise run secrets:sync              # GitHub Actions + Cloudflare API Worker
mise run secrets:sync:github       # repository secrets only (incl. CLOUDFLARE_ZONE_ID)
mise run secrets:sync:cloudflare   # production API Worker secrets only
```

Requires `gh auth login` for GitHub and `wrangler` auth (`LOCAL_CLOUDFLARE_API_TOKEN` in
`.env` for secret sync, or `wrangler login`) for Cloudflare.

To set a single API Worker secret from `apps/api`:

```powershell
wrangler secret put DATABASE_URL --env production
```

## Neon

Use Neon Postgres for `DATABASE_URL`. Apply migrations before promoting an API
deploy that depends on schema changes:

```powershell
mise run api:db:migrate
mise run api:deploy:dry-run
mise run api:deploy
```

Migration `0003_omniscient_landau` adds `locations` to `gyms` and upserts the
Sydney catalog (Blochaus, 9 Degrees, Nomad) with stable ids, legacy grade
labels, and branch names.

Use the pooled Neon URL for runtime Worker traffic unless a migration tool or
maintenance task explicitly needs a direct connection string.

## R2 custom domain

R2 public URLs are **not** a Worker binding in `wrangler.jsonc`. The bucket stays
bound as `MEDIA_BUCKET` for uploads; browsers read objects via `PUBLIC_PHOTO_URL_BASE`
(`https://cdn.boulder.best`), configured in `apps/api/wrangler.jsonc` and
`apps/api/mise.toml` (`api:r2:domain:*` tasks).

After the bucket exists, set `CLOUDFLARE_ZONE_ID` in `.env` (zone overview in the
dashboard), then connect the custom domain from git:

```powershell
mise run api:r2:domain:ensure   # idempotent
mise run api:r2:domain:list
mise run api:r2:cors:apply
mise run api:r2:cors:list
```

`api:r2:domain:add` is the non-idempotent equivalent. Wrangler creates the
`cdn` DNS record and certificate; no dashboard “Connect domain” step needed.

`apps/api/r2-cors.json` is the source-controlled CORS rule file.

## Preview deployments (pull requests)

Per-PR previews use [Cloudflare Preview URLs](https://developers.cloudflare.com/workers/configuration/previews/) (`wrangler versions upload --preview-alias pr-<n>`) for `boulder-api` and `boulder-frontend`, plus a permanent gateway Worker on `*.preview.boulder.best` that reverse-proxies to the aliased `workers.dev` backends. Reviewers open a stable URL such as `https://pr-<n>.preview.boulder.best` with same-origin `/api` routing (like production), so email/password auth and passkeys work with `PASSKEY_RP_ID=boulder.best`.

Production and PR previews both deploy automatically from `.github/workflows/deploy.yml` after CI passes. Main uses `wrangler deploy`; pull requests use `wrangler versions upload` with preview aliases (production routes on `boulder.best` are untouched).

### Architecture

```text
Browser → pr-<n>.preview.boulder.best (boulder-preview-gateway)
  /api/*  → https://pr-<n>-boulder-api.<subdomain>.workers.dev
  /*      → https://pr-<n>-boulder-frontend.<subdomain>.workers.dev
```

Each preview API version uses a dedicated Neon branch (`pr-<n>`) for `DATABASE_URL`. Other Worker secrets inherit from the production Worker account (v1).

### One-time gateway setup

Deploy the gateway Worker once and set your account `workers.dev` subdomain:

```powershell
# Subdomain is shown by `wrangler whoami` (e.g. boulder-dot-best)
mise run preview-gateway:deploy
```

Update `WORKERS_SUBDOMAIN` in `apps/preview-gateway/wrangler.jsonc` (production vars) or override via the dashboard if it differs from the committed placeholder. Wrangler attaches the wildcard route `*.preview.boulder.best/*` on the `boulder.best` zone.

### GitHub Actions

`.github/workflows/deploy.yml` runs after CI succeeds:

| Trigger                     | Job               | Action                                              |
| --------------------------- | ----------------- | --------------------------------------------------- |
| Push to `main` (CI success) | `deploy`          | Production `wrangler deploy`                        |
| Pull request (CI success)   | `preview`         | Neon branch, migrate, `versions upload`, PR comment |
| Pull request closed         | `preview-cleanup` | Delete Neon branch `pr-<number>`                    |

Preview deploy steps:

1. Creates (or reuses) Neon branch `pr-<number>`
2. Runs `mise run api:db:migrate` against the branch
3. Uploads API + frontend preview versions with alias `pr-<number>`
4. Comments on the PR with `https://pr-<number>.preview.boulder.best`

**Repository secrets / variables:**

| Name                    | Type     | Purpose                     |
| ----------------------- | -------- | --------------------------- |
| `CLOUDFLARE_API_TOKEN`  | secret   | Versions upload (existing)  |
| `CLOUDFLARE_ACCOUNT_ID` | secret   | Wrangler account (existing) |
| `NEON_API_KEY`          | secret   | Neon branch create/delete   |
| `NEON_PROJECT_ID`       | variable | Neon project ID             |

### Local preview upload (manual)

```powershell
$env:PREVIEW_ALIAS = "pr-123"
$env:PREVIEW_ORIGIN = "https://pr-123.preview.boulder.best"
$env:PREVIEW_SECRETS_FILE = ".env"   # must include DATABASE_URL
mise run api:preview:upload
mise run frontend:preview:upload
```

Do not set `VITE_API_BASE_URL` for preview frontend builds — the gateway serves API routes on the same origin.

### Manual smoke test

1. Open a test PR and wait for the preview bot comment.
2. Load the SPA at `https://pr-<n>.preview.boulder.best`.
3. `GET /api/health` should return `{ "ok": true }` (or the current health payload).
4. Exercise email/password sign-up and sign-in.
5. Optional: passkey register + sign-in (`PASSKEY_RP_ID=boulder.best`).
6. Confirm `https://boulder.best` is unchanged after a preview upload.

Preview deploys use the same Sentry repository secrets as production (`VITE_SENTRY_DSN_FRONTEND`, `SENTRY_AUTH_TOKEN`, org/project slugs). Release IDs use the PR head commit SHA. API runtime reporting uses the production Worker `SENTRY_DSN_API` secret (inherited on `versions upload`).

### Known limitations (v1)

- OAuth redirect URIs are not registered for preview hosts.
- Preview Worker logs are limited compared to routed production Workers.
- R2 uses the shared production bucket.
- Underlying `*.workers.dev` preview URLs remain publicly reachable; use the gateway URL for review.
