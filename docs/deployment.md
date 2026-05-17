# Deployment

This app deploys to Cloudflare Workers. The frontend is a Workers Static Assets
SPA, and the API is a separate Worker routed under `https://boulder.best/api/*`.
Keep deployment commands in mise tasks; do not add package.json scripts.

## Cloudflare account setup

Workers are created on first deploy. Wrangler resolves the target account from
`CLOUDFLARE_ACCOUNT_ID` (recommended) or your logged-in default account.

**Local:** add to the repo root `.env` (see `.env.example`), or run
`wrangler login` and `wrangler whoami`.

**CI:** set the `CLOUDFLARE_ACCOUNT_ID` repository secret (see `.github/workflows/deploy.yml`).

```powershell
wrangler login   # optional if CLOUDFLARE_ACCOUNT_ID is in .env
wrangler whoami
```

### Workers and R2

| Resource                     | Name                   | Notes                                                  |
| ---------------------------- | ---------------------- | ------------------------------------------------------ |
| API Worker (production)      | `boulder-api`          | Route `boulder.best/api/*`                             |
| Frontend Worker (production) | `boulder-frontend`     | Custom domain `boulder.best` (DNS managed on deploy)   |
| API Worker route             | `boulder.best/api/*`   | Zone route; takes precedence over the frontend domain  |
| R2 (production)              | `boulder-dot-best`     | Bound as `MEDIA_BUCKET`; public URL `cdn.boulder.best` |
| R2 (local dev)               | `boulder-dot-best-dev` | Preview bucket for `wrangler dev --env dev`            |

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
```

Required non-secret production vars:

```text
BETTER_AUTH_URL=https://boulder.best
FRONTEND_URL=https://boulder.best
PASSKEY_RP_ID=boulder.best
PASSKEY_ORIGIN=https://boulder.best
PUBLIC_PHOTO_URL_BASE=https://cdn.boulder.best
```

Fill in the repo root `.env` (see `.env.example`), then sync all API secrets at
once:

```powershell
mise run api:secrets:sync
```

That reads `.env` and runs `wrangler secret bulk` for the production API
Worker. You can still set secrets individually from `apps/api` if needed:

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

Use the pooled Neon URL for runtime Worker traffic unless a migration tool or
maintenance task explicitly needs a direct connection string.

## R2 Media Placeholder

The API Worker binds `MEDIA_BUCKET` to `boulder-dot-best` in production and
uses `PUBLIC_PHOTO_URL_BASE` for browser-readable photo URLs. Before media
upload endpoints are used in production, configure the bucket's public/custom
domain and apply CORS:

```powershell
mise run api:r2:cors:apply
mise run api:r2:cors:list
```

`apps/api/r2-cors.json` is the source-controlled CORS rule file.
