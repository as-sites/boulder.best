# Boulder Best MVP Implementation Plan

This file is the source of truth for the MVP implementation. Future agents should not need to read `features.md`, `Project-Blueprint.md`, or the draft TypeScript files under `plans/` to understand product scope. Those files are historical references only.

The app is an offline-first Progressive Web App for tracking bouldering sessions on mobile devices, including poor reception and browser backgrounding scenarios. Users can track sessions locally, attach photos, and sync to the cloud when they are ready.

---

## Current repo shape and ownership

- `apps/frontend` owns the React/Vite PWA, routes, UI, local offline workflows, and sync client.
- `apps/api` owns Cloudflare Worker handlers, API middleware, Drizzle database access, R2 upload preparation, and deployment config.
- `packages/api-contract` owns shared Hono RPC route contracts, zod schemas, OpenAPI route definitions, and generated/shared API types.
- `packages/auth` owns shared better-auth server configuration and auth Drizzle schema.

Frontend code must not import from `apps/api`. Shared API shape flows through `@boulder/api-contract`.

Keep package boundaries coarse and intentional. Do not create tiny packages unless a later implementation makes the boundary clearly worthwhile.

---

## Locked MVP decisions

1. **Auth provider priority:** MVP includes email/password, Google, Discord, and passkeys through better-auth.
2. **Offline mode UX:** Manual Offline Mode disables automatic sync and retry attempts. Users must turn it off before the queue auto-drains.
3. **History merge strategy:** Server-synced and local unsynced sessions appear in the same chronological history. Pending/error local sessions get both a small visual separator for local pending groups and a pending/error icon or badge on each affected item.
4. **R2 object key strategy:** R2 object keys are generated as `userId/sessionId/entryId/timestamp-index.ext`.
   - Backend derives `userId` from the authenticated session.
   - `sessionId`, `entryId`, image `id`, and image `index` come from the client payload.
   - `timestamp` is generated server-side at presign time as epoch milliseconds.
   - `ext` is derived from validated image MIME type.
5. **R2 retention/deletion:** Do not delete R2 objects for MVP. Uploaded images are retained forever unless this is revisited later.
6. **Gym/grade admin ownership:** Gyms and grade definitions are read-only in the app. They are managed by direct database edits for now. No gym/grade admin UI in MVP.
7. **Image compression:** Do not compress images for MVP. Do not install or use `browser-image-compression` for now.
8. **Image size limit:** The per-image upload limit is 30 MB. Keep validation and user-facing error copy consistent with 30 MB.

---

## Non-negotiable implementation rules

- Use `mise run <task>` / `mise <task>` for task execution. Do not add or use `package.json` scripts.
- Use `pnpm` only for dependency installation, not for running scripts.
- Do not introduce Nx or Turborepo.
- Use oxlint and oxfmt only. Do not introduce ESLint or Prettier.
- Use Hono RPC via `hono/client`. Do not introduce tRPC or oRPC.
- Use `@hono/zod-openapi` for validated route definitions and OpenAPI/Swagger output.
- Use Dexie + `dexie-react-hooks` for offline state that should bind directly to IndexedDB, such as sync queue counts.
- Do not mirror Dexie query state into React Context.
- Do not use Zustand unless a later implementation proves React Context/local orchestration is insufficient.
- Use Temporal timestamp diffing for timers: `accumulatedDuration + (Temporal.Now.instant() - activeStartTime)`.
- Do not update react-hook-form state or React Context every second for visual timers. Visual ticking must stay inside local timer display components using `requestAnimationFrame`.
- Do not implement Screen Wake Lock unless explicitly requested later as an opt-in user preference.
- Always request persistent storage with `navigator.storage.persist()` during startup or before tracking sessions.
- Never store images as Base64 JSON. Store image `Blob`s in a dedicated Dexie table.
- Use native camera/file capture with `<input type="file" accept="image/*" capture="environment">`. Do not install webcam packages.
- When previewing local images, use `URL.createObjectURL()` and clean up with `URL.revokeObjectURL()` in `useEffect` cleanup or when replacing/deleting the preview.
- Keep climbs and breaks in one Postgres `session_entries` table with `type: 'climb' | 'break'`.
- Always use `sequenceOrder` for timeline ordering.
- Backend stores client-supplied final `durationMs` / `totalDurationMs`. It does not recalculate durations from timestamps.
- Frontend Sentry config must set `tracesSampleRate: 0` and ignore expected offline/network errors such as `Failed to fetch` and `Network Error`.

---

## MVP product behavior

### Core user flow

1. User signs in.
2. User selects a gym from a backend-provided list.
3. User starts a session.
4. User adds climbs and breaks in one chronological timeline.
5. User optionally adds notes and photos to climbs.
6. User stops the session.
7. Session is finalized locally first.
8. If automatic sync is allowed, the app syncs when online. If Manual Offline Mode is enabled, it stays queued.
9. User can view session history from the server plus local unsynced sessions on the current device.

### Offline behavior

- Manual Offline Mode is a user setting for avoiding unintended data use.
- Effective offline state is `manualOfflineMode || !navigator.onLine`.
- Manual Offline Mode blocks automatic queue draining and background retries.
- Physical offline state also blocks automatic queue draining.
- Queued sessions remain visible in history.
- Local unsynced sessions are current-device only.
- Synced sessions are visible across devices.
- App must request persistent storage so mobile browsers are less likely to evict session data/images.

### Sync behavior

- Sync is queue based and retry safe.
- Image uploads happen before the final session JSON payload is submitted.
- A session is marked synced only after image uploads and session sync both succeed.
- Failed queue items keep last error and retry metadata.
- Automatic retries can run only while the app is open, online, authenticated, and Manual Offline Mode is off.
- `Sync now` can exist as an explicit user command, but should not silently bypass Manual Offline Mode. For MVP, disable `Sync now` while Manual Offline Mode is on and explain that the user must turn Offline Mode off before syncing.

---

## Tech stack

### Frontend

- React + Vite.
- TanStack Router for client routing.
- TanStack Query for remote data fetching and cache management.
- Mantine v9+ for UI components.
- Phosphor Icons (`@phosphor-icons/react`) for UI icons.
- react-hook-form + zod for forms/validation.
- `@trendcapital/react-hook-form-mantine` for Mantine-compatible form fields where useful.
- Dexie + `dexie-react-hooks` for IndexedDB.
- Native Temporal API for timers and timestamps.
- vite-plugin-pwa for app shell/service worker.
- Sentry for frontend error tracking with tracing disabled.

### Backend

- Cloudflare Workers for API runtime.
- Cloudflare Workers Static Assets / Vite Cloudflare setup for frontend hosting direction.
- Hono and `@hono/zod-openapi`.
- Hono RPC client (`hono/client`) for typed frontend calls.
- Neon Serverless Postgres.
- Drizzle ORM + drizzle-kit migrations.
- Cloudflare R2 for images.
- better-auth with Drizzle adapter.

---

## Data contracts

These shapes are the intended MVP contracts. Implementations can name files/symbols differently, but the data semantics should match.

### Timer state

```ts
interface TimerState {
  accumulatedDurationMs: number;
  activeStartTime: string | null; // Temporal.Instant string
  status: 'idle' | 'running' | 'paused' | 'stopped';
}
```

Display duration is calculated from the stored state:

```ts
activeStartTime === null
  ? accumulatedDurationMs
  : accumulatedDurationMs +
    (Temporal.Now.instant().epochMilliseconds -
      Temporal.Instant.from(activeStartTime).epochMilliseconds);
```

### Session form values

```ts
interface SessionFormValues {
  id: string;
  gymId: string | null;
  startTime: string | null;
  endTime: string | null;
  totalDurationMs: number;
  notes?: string | null;
  status: 'not_started' | 'active' | 'stopped';
  entries: SessionFormEntry[];
}

type SessionFormEntry = ClimbFormEntry | BreakFormEntry;

interface BaseFormEntry {
  id: string;
  sequenceOrder: number;
  durationMs: number;
  timer: TimerState;
}

interface ClimbFormEntry extends BaseFormEntry {
  type: 'climb';
  name: string;
  grade: string | null;
  attempts: number;
  completed: boolean;
  notes?: string | null;
}

interface BreakFormEntry extends BaseFormEntry {
  type: 'break';
}
```

Use a zod discriminated union on `type` for `entries`.

### Offline image

```ts
interface OfflineImage {
  id: string;
  sessionId: string;
  entryId: string;
  index: number;
  blob: Blob;
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
  contentLength: number;
  createdAt: number;
}
```

Images are stored separately from the session payload. The session JSON stores image references/metadata, never Blob data.

### Sync queue item

```ts
interface SyncQueueItem {
  id: string; // matches session id
  sessionId: string;
  payload: SyncSessionPayload;
  status: 'pending' | 'syncing' | 'error' | 'synced';
  retryCount: number;
  lastError?: string;
  nextRetryAt?: number;
  createdAt: number;
  updatedAt: number;
}
```

### Final sync payload

```ts
interface SyncSessionPayload {
  id: string;
  gymId: string;
  startTime: string;
  endTime: string;
  totalDurationMs: number;
  notes?: string | null;
  entries: SyncSessionEntry[];
}

type SyncSessionEntry = SyncClimbEntry | SyncBreakEntry;

interface SyncBaseEntry {
  id: string;
  sequenceOrder: number;
  durationMs: number;
}

interface SyncClimbEntry extends SyncBaseEntry {
  type: 'climb';
  name: string | null;
  grade: string | null;
  attempts: number | null;
  completed: boolean | null;
  notes?: string | null;
  images: SyncedImage[];
}

interface SyncBreakEntry extends SyncBaseEntry {
  type: 'break';
}

interface SyncedImage {
  id: string;
  index: number;
  objectKey: string;
  photoUrl: string;
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
  contentLength: number;
}
```

The sync endpoint must be idempotent for the same authenticated user and client-generated session/entry/image IDs.

### Database model

- `gyms`
  - `id`
  - `name`
  - `grades` as an ordered text array
  - `createdAt`
  - `updatedAt`
- `sessions`
  - `id`
  - `userId`
  - `gymId`
  - `startTime`
  - `endTime`
  - `totalDurationMs`
  - `notes`
  - `createdAt`
  - `updatedAt`
- `session_entries`
  - `id`
  - `sessionId`
  - `userId`
  - `sequenceOrder`
  - `type` enum: `climb` or `break`
  - `durationMs`
  - nullable climb fields: `name`, `grade`, `attempts`, `completed`, `notes`
  - `createdAt`
  - `updatedAt`
- `session_entry_images`
  - `id`
  - `sessionId`
  - `entryId`
  - `userId`
  - `index`
  - `objectKey`
  - `photoUrl`
  - `contentType`
  - `contentLength`
  - `createdAt`

Do not create separate `climbs` and `breaks` tables.

### API routes

- `GET /api/gyms`
  - Authenticated.
  - Returns `Array<{ id, name, grades, updatedAt }>` for online use and offline cache hydration.
- `POST /api/uploads/presigned-url`
  - Authenticated.
  - Request: `{ sessionId, entryId, imageId, index, contentType, contentLength }`.
  - `contentType` must be `image/jpeg`, `image/png`, or `image/webp`.
  - `contentLength` must be at most `30 * 1024 * 1024`.
  - Response: `{ uploadUrl, objectKey, photoUrl, image }`.
  - Backend generates object key as `userId/sessionId/entryId/timestamp-index.ext`.
- `POST /api/sessions/sync`
  - Authenticated.
  - Accepts `SyncSessionPayload`.
  - Upserts idempotently for the authenticated user.
  - Inserts/updates session, entries, and image metadata.
  - Preserves `sequenceOrder`.
  - Trusts client-calculated durations.
- `GET /api/sessions`
  - Authenticated.
  - Query: `limit` 1-50, default 20; optional datetime cursor.
  - Returns newest sessions first, using `startTime` as the cursor basis.
  - Returns paginated list items with `id`, `gymId`, `gymName`, `startTime`, `endTime`, `totalDurationMs`, `entryCount`, and `nextCursor`.
- `GET /api/sessions/:id`
  - Authenticated.
  - Returns session detail with entries sorted by `sequenceOrder` and climb images sorted by `index`.
- `GET /openapi.json` or equivalent
  - Provides OpenAPI output from `@hono/zod-openapi`.

---

## Parallel execution model

- **Wave 1:** Agents A, B, C, D, and E start in parallel.
- **Wave 1.5:** Agent F starts once C and D have draft queue/upload contracts.
- **Wave 2:** Agent G integrates A-F.
- **Wave 3:** Agent H hardens and verifies. H can start tests/Sentry scaffolding early, but final validation happens after G.

Each agent should keep edits inside its owned area as much as possible. Shared contracts are the main coordination point.

---

## Agent A - App shell, routing, PWA, settings

### Ticket A1: Frontend app shell and routes

**Description:** Build the app frame and route structure for the MVP PWA.

**Scope:**

- Mantine provider.
- TanStack Query provider.
- TanStack Router route tree.
- Routes for:
  - Active session tracker.
  - Session history.
  - Settings.
  - Auth entry/account route placeholders; Agent E owns the auth UI content.
- App-level loading and error boundaries.
- Mobile-first layout suitable for gym use.

**Acceptance criteria:**

- App boots to an actual usable route, not a marketing landing page.
- Navigation between tracker, history, settings, and auth/account surfaces works.
- Route components can be developed independently by other agents.

### Ticket A2: PWA shell and persistent storage

**Description:** Make the app installable/offline-capable at the shell level and request persistent storage.

**Scope:**

- Add/configure vite-plugin-pwa.
- Cache the app shell and static assets needed to open the app offline.
- Do not rely on browser Background Sync API for MVP.
- Add startup storage persistence flow with `navigator.storage.persist()`.
- Gracefully handle unsupported browsers or denied persistence.

**Acceptance criteria:**

- App shell loads after refresh in poor connectivity once previously loaded.
- Persistent storage is requested without blocking core app use.
- The storage request outcome can be surfaced or logged for debugging.

### Ticket A3: Settings and Manual Offline Mode

**Description:** Add a Settings screen with a Manual Offline Mode toggle.

**Scope:**

- Store Manual Offline Mode locally, using `@mantine/hooks` local storage or a small settings context/hook.
- Do not store Dexie query results in React Context.
- Make the setting available to sync logic.
- Show enough status for users to understand whether auto sync is blocked by manual mode or browser offline state.

**Acceptance criteria:**

- Toggling Manual Offline Mode persists across refresh.
- Auto sync/retry does not run while Manual Offline Mode is on.
- Settings can show pending/error queue counts provided by Agent C.

---

## Agent B - Session tracker UX, timeline rows, timers

### Ticket B1: Session form and top-of-screen controls

**Description:** Build the active session form and top-level session controls.

**Scope:**

- Gym dropdown loaded from cached/remote gyms.
- Session timer text starts at `0` and counts only after Start Session.
- Before session start, show Start Session.
- After session start, show Stop Session in the Start Session area.
- Stop Session finalizes timers and hands the draft to Agent C.
- Session-level notes are supported.
- Form uses react-hook-form + zod.

**Acceptance criteria:**

- User cannot finalize a session without a selected gym and valid started session.
- Start/stop button visibility matches session state.
- Stopping a session produces final `startTime`, `endTime`, `totalDurationMs`, and entry durations.

### Ticket B2: Climb row UI and behavior

**Description:** Implement climb timeline rows.

**Scope:**

- New climb rows default to `Climb X`, where X counts only climb rows and ignores breaks.
- Climb name is editable text.
- Grade dropdown uses the selected gym's grade array.
- Timer text starts at zero and reflects local timer state.
- Start button begins timer and is replaced by Pause while running.
- Pause button pauses timer and is replaced by Start when paused.
- Stop button is visible after elapsed time is greater than zero.
- Stop finalizes the climb, removes play/pause/stop controls, and leaves final time visible.
- Attempts starts at `1`.
- Attempts supports a plus button and direct numeric edit. A minus control is allowed if Mantine's numeric control naturally provides one, but value must not go below 1.
- Completed checkbox marks whether the climb was topped.
- Climb notes are supported.
- Photo attach/delete handoff points are available for Agent F.

**Acceptance criteria:**

- Climb rows can be added, edited, timed, paused, stopped, and finalized.
- Finalized climb rows no longer tick.
- Form state changes only on meaningful user/timer actions, not every visual frame.

### Ticket B3: Break row UI and orchestration

**Description:** Implement break timeline rows and cross-row timer behavior.

**Scope:**

- Add Break creates a break row at the bottom of the list.
- Break timer starts automatically when the row is added.
- If automatic start fails for a browser/state reason, a Start Break fallback button is acceptable.
- Starting a break pauses any currently running climb.
- End Break stops the break timer.
- End Break replaces Start Break while running.
- If the preceding row is a paused, not stopped climb, ending the break resumes that climb.

**Acceptance criteria:**

- Only valid timers run after break start/end transitions.
- Break duration is finalized on End Break.
- Preceding paused climb resumes exactly when specified.

### Ticket B4: Timer implementation

**Description:** Implement pause-resilient timer helpers and display components.

**Scope:**

- Timer math uses `Temporal.Now.instant()`.
- Timer state stores `accumulatedDurationMs` and optional `activeStartTime`.
- Visual display components use `requestAnimationFrame`.
- Backgrounding is handled by timestamp diffing, not by special wake/background logic.
- No Screen Wake Lock.

**Acceptance criteria:**

- Timers catch up after browser sleep/backgrounding.
- No form-wide or context-wide second-by-second updates.
- Unit tests can exercise timer math without React rendering.

---

## Agent C - Dexie offline layer, drafts, queue, Blob store

### Ticket C1: Dexie schema and repositories

**Description:** Implement IndexedDB storage for offline-first behavior.

**Scope:**

- Tables:
  - `cachedGyms`
  - `draftSession`
  - `syncQueue`
  - `offlineImages`
- Repositories for create/read/update/delete operations.
- Dexie singleton and typed table definitions.
- Schema should support future Dexie version upgrades.

**Acceptance criteria:**

- App can read/write draft sessions, cached gyms, queue items, and images.
- Data survives refresh.
- No image Blob is embedded in JSON payload tables.

### Ticket C2: Active draft autosave and restore

**Description:** Prevent session data loss during refresh/crash.

**Scope:**

- Store one active draft session with ID `active`.
- Autosave meaningful form state changes.
- Restore active draft on app load.
- Clear draft after finalizing into queue.
- Persist enough timer state to resume display correctly after reload.

**Acceptance criteria:**

- Refreshing mid-session restores the selected gym, entries, attempts, completion state, notes, photos, and timer states.
- Stop Session finalizes the draft and moves it into the queue.

### Ticket C3: Sync queue state and hooks

**Description:** Model queued sessions and expose UI hooks.

**Scope:**

- Queue statuses: `pending`, `syncing`, `error`, `synced`.
- Store retry count, last error, timestamps, and `nextRetryAt`.
- Hooks via `useLiveQuery` for:
  - Pending count.
  - Error count.
  - Queue list for history merge.
- Do not copy these query results into React Context.

**Acceptance criteria:**

- Settings and history update live when queue state changes.
- Queue items can be marked pending/syncing/error/synced consistently.

### Ticket C4: Offline images and preview URLs

**Description:** Store local image Blobs and provide safe preview behavior.

**Scope:**

- Store original selected/captured image Blobs without compression.
- Enforce or surface the 30 MB limit before upload/presign.
- Support multiple images per climb entry.
- Store `sessionId`, `entryId`, stable `index`, MIME type, and byte length.
- Provide a preview helper/hook that creates object URLs and always revokes them.

**Acceptance criteria:**

- Local photo previews work.
- Replacing/deleting a local photo revokes old object URLs.
- No Base64 image storage.
- No image compression dependency or pipeline exists in MVP.

### Ticket C5: Gym cache

**Description:** Cache gym and grade data for offline dropdowns.

**Scope:**

- Store gym `id`, `name`, ordered `grades`, and `updatedAt`.
- Refresh cache from `GET /api/gyms` when online.
- Use cached gyms when offline.
- Handle empty gym list gracefully.

**Acceptance criteria:**

- Grade dropdown works after gym data has been cached.
- Empty/failed gym loading does not crash active session UI.

---

## Agent D - API contract, backend data model, Neon/Drizzle

### Ticket D1: Shared API contract and OpenAPI

**Description:** Expand `@boulder/api-contract` into the source of shared API truth.

**Scope:**

- zod schemas for gyms, uploads, sync payloads, history list, and session detail.
- Hono RPC-compatible route definitions.
- `@hono/zod-openapi` route metadata.
- OpenAPI JSON route or generated spec output.

**Acceptance criteria:**

- Frontend can call typed Hono RPC methods without importing `apps/api`.
- API app can mount the same contract and implement handlers.
- OpenAPI output includes all MVP routes.

### Ticket D2: Drizzle schema and migrations

**Description:** Implement database schema for gyms, sessions, entries, image metadata, and better-auth compatibility.

**Scope:**

- Add/maintain Drizzle schema for:
  - `gyms`
  - `sessions`
  - `session_entries`
  - `session_entry_images`
- Include indexes for user/session/history access.
- Preserve auth schema from `packages/auth`.
- Generate migrations with drizzle-kit through mise tasks.

**Acceptance criteria:**

- `session_entries` is the only table for climbs and breaks.
- Image metadata supports multiple photos per climb.
- Migrations include better-auth tables and passkey-required fields.

### Ticket D3: Gym endpoint

**Description:** Serve read-only gym and grade configuration.

**Scope:**

- `GET /api/gyms` returns gym `id`, `name`, `grades`, and `updatedAt`.
- No create/update/delete endpoints for gyms.
- No gym admin UI assumptions.

**Acceptance criteria:**

- Frontend can hydrate online and offline grade dropdowns.
- Direct DB edits to gyms/grades are reflected after cache refresh.

### Ticket D4: Presigned R2 upload endpoint

**Description:** Prepare authenticated direct uploads to R2.

**Scope:**

- `POST /api/uploads/presigned-url`.
- Validate MIME type: jpeg, png, webp.
- Validate `contentLength <= 30 * 1024 * 1024`.
- Error messages must say 30 MB, not 10 MB.
- Generate object key `userId/sessionId/entryId/timestamp-index.ext`.
- Return upload URL, object key, final photo URL, and image metadata.
- `photoUrl` must be a stable browser-readable URL for history/detail rendering, not the temporary presigned write URL.
- Do not delete existing R2 objects in MVP.

**Acceptance criteria:**

- Client can upload a local Blob to R2 using the returned URL.
- Server never trusts client-provided `userId`.
- Object keys are deterministic enough to audit and unique enough for multiple photos.

### Ticket D5: Session sync endpoint

**Description:** Ingest completed offline sessions.

**Scope:**

- `POST /api/sessions/sync`.
- Authenticated.
- Idempotent by authenticated user + client session ID.
- Insert/update session.
- Insert/update entries.
- Insert/update image metadata.
- Validate entries with zod discriminated union.
- Validate durations are nonnegative integers.
- Preserve `sequenceOrder`.
- Trust client-calculated durations.

**Acceptance criteria:**

- Retrying the same queued item does not duplicate session data.
- Break rows and climb rows are stored in `session_entries`.
- Images are associated with the correct climb entries.

### Ticket D6: Session history endpoints

**Description:** Provide cloud history for multi-device viewing.

**Scope:**

- `GET /api/sessions` with `limit` 1-50 and optional datetime cursor.
- Return list items with `id`, `gymId`, `gymName`, `startTime`, `endTime`, `totalDurationMs`, `entryCount`, and `nextCursor`.
- `GET /api/sessions/:id` returns detail with entries sorted by `sequenceOrder`.
- Climb images sorted by `index`.
- All data scoped to current user.

**Acceptance criteria:**

- User can view synced history from another device.
- Users cannot access each other's sessions.

---

## Agent E - Auth and account flows

### Ticket E1: better-auth server configuration

**Description:** Configure MVP authentication providers.

**Scope:**

- Email/password enabled.
- Google OAuth enabled.
- Discord OAuth enabled.
- Passkey plugin enabled.
- Account linking enabled.
- Drizzle adapter wired to the auth schema.
- Trusted origins configured from environment.
- Password reset email via Resend if the existing env/config path is used.

**Acceptance criteria:**

- Auth routes mount under `/api/auth/*`.
- Enabled providers match the locked MVP decisions.
- Server config does not expose non-portable internal types in public package exports.

### Ticket E2: Auth schema and migrations

**Description:** Keep auth database schema aligned with enabled providers/plugins.

**Scope:**

- Verify user, session, account, verification, and passkey tables.
- Ensure passkey schema fields match current better-auth plugin requirements.
- Coordinate migration generation with Agent D.

**Acceptance criteria:**

- Database schema supports email/password, OAuth accounts, and passkeys.
- Typecheck passes without leaking pnpm store paths through public package types.

### Ticket E3: Frontend auth client and UI

**Description:** Build sign-in/sign-up/session UI.

**Scope:**

- better-auth React client.
- Passkey client plugin.
- Email/password sign up and sign in.
- Google sign-in button.
- Discord sign-in button.
- Passkey sign-in.
- Add/register passkey flow for authenticated users.
- Sign out.
- Session loading/restoration state.

**Acceptance criteria:**

- User can authenticate with all MVP methods.
- Authenticated state gates session tracking/history appropriately.
- Auth works with local dev proxy and production API base URL.

### Ticket E4: Protected API middleware

**Description:** Provide authenticated user lookup to API handlers.

**Scope:**

- Middleware/helper to retrieve current user/session from better-auth.
- Handlers can access `userId`.
- Missing/invalid auth returns 401 on protected routes.

**Acceptance criteria:**

- Session sync/upload/history routes are protected.
- User ID is derived server-side.

---

## Agent F - Media upload and sync engine

### Ticket F1: Photo attach/delete UI integration

**Description:** Wire climb photo actions to offline storage.

**Scope:**

- Add Photo button uses native file input with `accept="image/*"` and `capture="environment"`.
- Allow multiple photos per climb entry.
- Display local previews.
- Delete removes a local pending image row and revokes preview URL.
- After a photo is already uploaded/synced, MVP does not delete the R2 object.

**Acceptance criteria:**

- Users can attach camera captures or uploaded images to climbs.
- Users can remove local pending photos before sync.
- No webcam package and no image compression package is used.

### Ticket F2: Queue drain orchestration

**Description:** Sync queued sessions when allowed.

**Scope:**

- Detect eligible queue items.
- Run only when authenticated, browser online, and Manual Offline Mode is off.
- Mark item `syncing` while work is in progress.
- Mark `error` with `lastError` and backoff metadata on failure.
- Mark `synced` or remove/clear queue item on success, depending on Agent C repository design.

**Acceptance criteria:**

- Auto sync does not run while Manual Offline Mode is on.
- Network failures do not lose queued data.
- Retry metadata is updated consistently.

### Ticket F3: Image upload step

**Description:** Upload local images before session payload sync.

**Scope:**

- For each offline image, request `POST /api/uploads/presigned-url`.
- Send image metadata including content type and content length.
- Enforce 30 MB image limit before presign.
- PUT Blob to returned upload URL.
- Store returned `objectKey` and `photoUrl` in queue state for retry-safe continuation.
- Do not compress images.

**Acceptance criteria:**

- Already-uploaded images are not re-uploaded unnecessarily during retry.
- Final session payload contains remote image metadata.
- Image upload failure keeps queue item recoverable.

### Ticket F4: Session sync step

**Description:** Submit final session JSON after image uploads.

**Scope:**

- Build `SyncSessionPayload` with remote image metadata.
- Submit through Hono RPC.
- Treat successful idempotent response as success even after previous partial retry.
- Clear local draft/queue/image data only after sync succeeds.

**Acceptance criteria:**

- A completed offline session becomes visible in server history after sync.
- Duplicate retries do not create duplicate sessions.

### Ticket F5: Sync controls and status UI

**Description:** Surface queue and sync state to the user.

**Scope:**

- `Sync now` command or settings/history action.
- Pending count.
- Error state with last error.
- Clear explanation when Manual Offline Mode is blocking auto sync.
- Optional "try again" for errored items.

**Acceptance criteria:**

- User understands whether data is local only, syncing, failed, or synced.
- User can intentionally retry when conditions allow.

---

## Agent G - Integration and history

### Ticket G1: End-to-end active session lifecycle

**Description:** Connect auth, gyms, tracker, Dexie, queue, sync, and backend.

**Scope:**

- Authenticated user selects gym.
- User starts session.
- User adds climbs, breaks, attempts, completion, notes, and photos.
- User stops session.
- Session finalizes locally.
- Session queues or syncs according to online/offline/manual mode state.

**Acceptance criteria:**

- Complete session can be captured without network.
- Same session syncs later when allowed.
- Temporary mocks are removed.

### Ticket G2: History list and detail

**Description:** Build history UI from server and local pending data.

**Scope:**

- Fetch server sessions via Hono RPC.
- Read local pending/error sessions from Dexie.
- Merge server and local sessions chronologically.
- Mark local unsynced/error sessions with pending/error icon or badge.
- Add a small visual separator where local pending groups appear.
- Detail view preserves `sequenceOrder`.
- Synced images render from `photoUrl`; pending images render from local object URL previews.

**Acceptance criteria:**

- Server sessions and local pending sessions appear together.
- Unsynced sessions are visually distinct but not hidden away.
- Session detail timeline order matches capture order.

### Ticket G3: Cross-device behavior

**Description:** Ensure cloud history works across devices without pretending local queue is global.

**Scope:**

- Synced sessions appear from any authenticated device.
- Local pending sessions appear only on the device that captured them.
- UI copy/status should make pending local state clear.

**Acceptance criteria:**

- User does not mistake a local pending session for cloud-synced data.
- Once synced, the session appears through the server history path.

### Ticket G4: Import and boundary cleanup

**Description:** Keep the repo architecture clean after integration.

**Scope:**

- Frontend imports API types/client only from `@boulder/api-contract`.
- Runtime handlers stay in `apps/api`.
- Shared auth stays in `packages/auth`.
- Remove leftover mocked gym/API/session data.

**Acceptance criteria:**

- No frontend imports from `apps/api`.
- Typecheck confirms public package boundaries are stable.

---

## Agent H - Observability, tests, verification, release hardening

### Ticket H1: Sentry setup

**Description:** Add frontend error tracking without noisy quota usage.

**Scope:**

- Initialize Sentry in frontend.
- `tracesSampleRate: 0`.
- `ignoreErrors` includes expected offline/network failures.
- Do not add performance tracing.

**Acceptance criteria:**

- Real app errors can be captured.
- Offline network noise is filtered.

### Ticket H2: Unit and integration tests

**Description:** Cover the riskiest logic with Vitest.

**Scope:**

- Timer math across start/pause/resume/stop/background gaps.
- Climb/break orchestration.
- Draft autosave and restore.
- Queue state transitions and retry/backoff.
- 30 MB image validation.
- Multi-photo local-to-remote payload mapping.
- Protected API access and user scoping.
- Idempotent session sync.
- History merge of synced and local pending sessions.

**Acceptance criteria:**

- Tests protect the offline/timer/sync behavior that is hardest to verify manually.
- Tests run through `mise run unit`.

### Ticket H3: Verification commands

**Description:** Run repo verification through mise.

**Commands:**

- `mise run typecheck`
- `mise run lint .`
- `mise run format --check .`
- `mise run unit`
- `mise run build`

**Acceptance criteria:**

- All commands pass, or any remaining failure is documented with cause and owner.
- No package.json scripts are added to make checks pass.

### Ticket H4: Release checklist

**Description:** Document what must exist for deployment.

**Scope:**

- Required frontend/API/auth/R2/Neon/Sentry env vars.
- Cloudflare Worker + Workers Static Assets deployment notes.
- R2 bucket/CORS/public URL or custom domain setup for `photoUrl`.
- Neon migration command and ordering.
- Initial gym/grade DB seed note, with reminder that gym admin UI is out of scope.
- Manual QA script for:
  - Offline session capture.
  - Photo attach/delete before sync.
  - Manual Offline Mode blocking auto sync.
  - Later sync.
  - History merge.

**Acceptance criteria:**

- A future deploy agent can identify all required environment/config steps from this file.

---

## Parallelization matrix

| Agent | Can start now? | Primary blockers                                        | Parallel with         |
| ----- | -------------- | ------------------------------------------------------- | --------------------- |
| A     | Yes            | None                                                    | B, C, D, E            |
| B     | Yes            | Real gym data/API later                                 | A, C, D, E            |
| C     | Yes            | None                                                    | A, B, D               |
| D     | Yes            | Auth middleware finalization with E                     | A, B, C, E            |
| E     | Yes            | Final protected route integration with D                | A, B, C, D            |
| F     | Partial        | Needs C queue/image APIs and D upload/session contracts | A/B/E early, then C/D |
| G     | No             | Initial A-F completion                                  | H late overlap        |
| H     | Partial        | Full integration for final verification                 | G                     |

---

## Milestones

1. **M1 - Foundation contracts:** D defines shared schemas/routes; C defines Dexie models; E validates auth schema.
2. **M2 - Offline session tracking:** A/B/C provide a usable offline active-session flow with draft restore and queue finalization.
3. **M3 - Authenticated backend persistence:** D/E connect protected session sync and read-only gyms/history.
4. **M4 - Media and sync:** F connects native image capture, R2 upload, queue drain, and manual sync controls.
5. **M5 - Integrated app:** G wires real history, removes mocks, and verifies the complete user flow.
6. **M6 - Hardening:** H completes Sentry, tests, checks, and release notes.

---

## Global acceptance criteria

- A user can sign up/sign in with email/password, Google, Discord, or passkey.
- A user can start a session offline, add climbs and breaks, pause/resume timers, add attempts/completion/notes/photos, stop the session, and retain it after refresh.
- Manual Offline Mode prevents automatic sync/retry attempts.
- No image compression is implemented for MVP.
- Sync accepts images up to 30 MB each, uploads local images to R2 using the locked object key strategy, then stores the session payload in Postgres.
- History shows server sessions and local pending sessions together, with unsynced sessions clearly marked.
- Gym and grade data are loaded read-only from the backend/cache, with no admin UI.
- No frontend code imports from `apps/api`.
- Final verification passes through mise tasks, or any remaining failure is documented with cause and owner.
