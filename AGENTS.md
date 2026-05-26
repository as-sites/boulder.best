# **AI Agent Directives & Architecture Context**

You are assisting with the **Bouldering Tracker App**, an offline-first Progressive Web App (PWA) built for tracking climbing sessions.

Before generating any code or suggesting architectural changes, you MUST read and adhere to the following directives.

## **1\. Tooling & Monorepo Rules (CRITICAL)**

- **Use mise tasks:** This monorepo uses mise for task management. **ALWAYS** use mise run \<task\> or mise \<task\> instead of raw npm, yarn, or pnpm run commands.
- **Mise MCP Server Preference:** Agents should prefer using the mise MCP server for task execution if available, and only resort to the CLI if the MCP server is not accessible.
- **Package Manager:** We use pnpm workspaces for package linking under the hood, but mise acts as the primary orchestrator. Do not suggest Nx or Turborepo.
- **Linting & Formatting:** Use oxlint and oxfmt exclusively. Do not install ESLint or Prettier unless specifically requested for a fallback edge-case.

## **2\. Tech Stack Boundaries**

- **Frontend:** React, Vite, TanStack Router, TanStack Query, Mantine (v9+), Phosphor Icons, react-hook-form \+ zod.
- **Mantine + react-hook-form:** Use `@trendcapital/react-hook-form-mantine` with **deep imports only** (e.g. `@trendcapital/react-hook-form-mantine/TextInput`). Do **not** import from the package root (`@trendcapital/react-hook-form-mantine`) — barrel imports break the Vite build.
- **Backend:** Cloudflare Workers (Edge runtime), Hono, @hono/zod-openapi.
- **Database:** Neon (Serverless Postgres), Drizzle ORM.
- **RPC/API:** We use native **Hono RPC (hono/client)**. Do NOT install or suggest tRPC or oRPC.
- **Auth:** better-auth using the Drizzle adapter.

## **3\. State Management & React Rules**

- **No Global State Libraries:** We are evaluating if we need Zustand for our state or if React Context is sufficient.
- **Offline Data State:** Use Dexie.js useLiveQuery to directly bind React UI to IndexedDB state (e.g., displaying the sync queue count). Do not sync Dexie state into React Context.
- **Render Optimization:** Do NOT update react-hook-form state or React Context every second for visual timers. **Visual ticking MUST be isolated** to the local component using requestAnimationFrame.

## **4\. Timer Logic & Hardware APIs**

- **Timestamp Diffing:** Timers use the native Temporal API (Temporal.Now.instant()). Calculate elapsed time via accumulatedDuration \+ (Now \- activeStartTime).
- **No Backgrounding Fixes Required:** Because we use timestamp diffing, the clock automatically "catches up" when the browser wakes up.
- **No Wake Lock:** Do NOT implement the Screen Wake Lock API unless explicitly asked to do so as an opt-in user preference.

## **5\. Offline-First & Storage Rules (Dexie.js)**

- **Storage Persistence:** Always request persistent storage via navigator.storage.persist() to prevent aggressive browser eviction.
- **Blob Separation:** Never encode images as Base64 JSON strings. Store image Blob files in a dedicated offlineImages Dexie table.
- **Memory Leaks:** When previewing local images, use URL.createObjectURL(). You MUST clean this up with URL.revokeObjectURL() inside a useEffect cleanup function.
- **Native Camera:** Do NOT install heavy React webcam packages. Use native HTML5: \<input type="file" accept="image/\*" capture="environment"\>.

## **6\. Database & Backend Schema (Drizzle \+ Postgres)**

- **Single Table Inheritance:** Climbs and Breaks are polymorphic entries stored in a SINGLE Postgres table (session_entries) using a discriminated union (type: 'climb' | 'break'). Do not create separate tables for them.
- **Chronological Ordering:** Always rely on the sequenceOrder integer column to maintain the user's timeline UI, rather than sorting by insertion timestamps.
- **Client-Driven Truth:** The backend expects the client to send the final, calculated durationMs for sessions and climbs. Do not recalculate durations on the server using createdAt timestamps.

## **7\. Observability (Sentry)**

- When initializing Sentry on the frontend, tracesSampleRate MUST be set to 0 to prevent performance tracing from exhausting free quotas.
- Always configure ignoreErrors to filter out expected browser offline events (e.g., "Failed to fetch", "Network Error").

---

See additional info in the `plans` directory:

- plans/features.md
- plans/Project Blueprint.md

## Cursor Cloud specific instructions

### Services overview

| Service         | Command                        | Port | Notes                                                                           |
| --------------- | ------------------------------ | ---- | ------------------------------------------------------------------------------- |
| Frontend (Vite) | `mise run //apps/frontend:dev` | 5173 | Proxies `/api/*` to the API on 8787                                             |
| API (Wrangler)  | `mise run //apps/api:dev`      | 8787 | R2 emulated locally; requires `DATABASE_URL` and `BETTER_AUTH_SECRET` in `.env` |

`mise dev` starts both in parallel.

### Environment setup

- **mise** is the task runner. Activate it with `eval "$(mise activate bash)"` in any new shell. The update script handles `mise install` and `pnpm install`.
- Copy `.env.example` to `.env` and fill in `DATABASE_URL` (Neon connection string) and `BETTER_AUTH_SECRET` (any random hex string). OAuth and Resend keys are optional.
- The `mise.toml` auto-loads `.env` (`_.file = ".env"`), so all mise tasks inherit these vars.

### Key commands (all via mise)

- **Lint:** `mise lint` (oxlint)
- **Format:** `mise format` / `mise format -- --check`
- **Test:** `mise test` (vitest, 4 projects: frontend, api, api-contract, auth)
- **Typecheck:** `mise typecheck` (runs `tsc -b` across all workspaces)
- **Build:** `mise build`

### Gotchas

- The test in `packages/api-contract/tests/rpc-client.test.ts` requires the TypeScript `dist/` output. Run `mise typecheck` before `mise test` if `dist/` doesn't exist yet.
- The wrangler dev server warns about missing optional secrets (Google/Discord OAuth, Resend). These are non-blocking for core local dev; auth sign-up/sign-in flows that touch the DB require a valid `DATABASE_URL`.
- Production routing uses `createBrowserHistory()`; tests pass `initialEntries` to get `createMemoryHistory`.
