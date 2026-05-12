# **Bouldering Tracker App \- Tech Stack & Architecture**

## **Overview**

A lightweight, client-side, offline-capable Progressive Web App (PWA) for tracking bouldering sessions at various gyms. Designed to be resilient to poor mobile reception and aggressive mobile browser background throttling.

## **Core Capabilities & Features**

- **Session Management:** Start/stop climbing sessions. Uses local timestamp diffing (Temporal.Now.instant()) for session and individual climb timers so the browser going to sleep does not pause the clock.
- **Climb Logging:** Log individual climbs (grade, attempts, success/fail) within a session.
- **Media & Notes:** Optionally attach pictures and text notes to specific climbs.
- **Manual Offline Mode:** A user-toggled "Offline Mode" setting. When active (or when the device physically loses connection), all sessions, climbs, and images are cached locally.
- **Sync Queue:** A manual sync trigger that bulk-uploads locally cached data and images to the cloud when the user is ready/on Wi-Fi. It uses background retries for network resilience.
- **Multi-Device Sync:** Cloud storage allows users to view their session history from any device.

## **Architecture & Infrastructure**

- **Monorepo Tooling:** pnpm workspaces for package linking, managed via mise experimental tasks/monorepo support (avoids Nx/Turborepo bloat).
- **Frontend Hosting:** Cloudflare Pages (or Vercel)
- **Backend API:** Cloudflare Workers (Edge runtime)
- **Database:** Neon (Serverless PostgreSQL)
- **Blob/Image Storage:** Cloudflare R2 (S3-compatible, zero egress fees)
- **Linting & Formatting:** oxlint for lightning-fast Rust-based linting, paired with oxfmt for fast, standardized code formatting within the Oxc ecosystem.
- **Testing:** Vitest for testing complex offline queue state logic and API endpoints.

## **Tech Stack: Frontend**

- **Framework:** React (compiled via Vite)
- **PWA Enabler:** vite-plugin-pwa (handles service workers and caching the app shell)
- **Routing:** TanStack Router (Type-safe client-side routing)
- **Data Fetching & API Client:** TanStack Query (React Query) paired with hono/client (Hono RPC) for end-to-end type safety without manual type declarations.
- **UI / Components:** Mantine (Comprehensive styled component library)
- **Icons:** Phosphor Icons (@phosphor-icons/react \- Clean, highly legible, and pairs perfectly with Mantine)
- **Forms & Validation:** react-hook-form combined with zod schema validation and @trendcapital/react-hook-form-mantine (Mantine v9+ compatible adapter)
- **Offline Local Database:** Dexie.js (Minimalist wrapper for IndexedDB to store pending offline uploads and images as Blobs) with dexie-react-hooks
- **Image Compression:** browser-image-compression (compress images before saving to Dexie to avoid hitting IndexedDB quotas and speed up syncing).
- **Date & Time:** Native JavaScript Temporal API (no external libraries needed for Chromium/Firefox targets).
- **Global State:** Zustand (Small, simple state manager for things like the global "Offline Mode" toggle and orchestrating complex Timer interactions across the session).
- **Observability / Error Tracking:** Sentry (Configured to ignore offline network spam and with performance tracing disabled to stay within free tiers).

## **Tech Stack: Backend**

- **API Framework:** Hono (Ultra-fast, edge-native web framework similar to Express)
- **API Specification:** @hono/zod-openapi (Builds standard REST endpoints validated by Zod, automatically generates OpenAPI/Swagger specs, and powers the frontend RPC types).
- **Database ORM:** Drizzle ORM (Type-safe, works perfectly with Neon's HTTP driver on Edge) paired with drizzle-kit for automated SQL migration generation.
- **Authentication:** better-auth (Handling Email/Password, Passkeys, Google, and Discord OAuth, plus account linking). It will use the Drizzle database adapter to sync sessions to Neon.

## **Key Technical Patterns to Note for AI Agents**

1. **Pause-Resilient Timers:** Because timers can be paused/resumed, do NOT just store a single startTime. Timer state must be a combination of accumulatedDuration (time elapsed prior to the current active period) and an optional activeStartTime (a Temporal instant of when the timer was last resumed). Total time \= accumulatedDuration \+ (Temporal.Now \- activeStartTime).
2. **Render-Optimized Ticking UI:** The ticking visual timers (Session, Climb, and Break timers) MUST be decoupled from react-hook-form and global state. Do not update form state every second. Use isolated local component state or requestAnimationFrame for the visual update to prevent the entire form from re-rendering 60 times a second.
3. **Polymorphic Event Timelines:** A session consists of both "Climbs" and "Breaks" in a single chronological list. The react-hook-form schema MUST use a Zod Discriminated Union (z.discriminatedUnion('type', \[ClimbSchema, BreakSchema\])) to type the useFieldArray correctly.
4. **Polymorphic Name Generation:** When a new climb is added, generating the default "Climb X" string must dynamically filter the useFieldArray values to count only rows where type \=== 'climb', ignoring break rows.
5. **Screen Wake Lock API:** The app should have a toggle for keeping the screen awake that defaults to off, and if enabled, it should use `navigator.wakeLock.request('screen') to prevent the user's mobile device from dimming or sleeping while they are doing their climb.
6. **Local Image Memory Management:** When a user attaches or replaces a photo offline, the UI will preview the File/Blob using URL.createObjectURL(). The app MUST clean these up using URL.revokeObjectURL() inside a useEffect cleanup function or upon deletion to prevent severe memory leaks on mobile devices.
7. **Active Session Auto-Saving:** To prevent data loss if the mobile browser reloads or crashes mid-session, the active react-hook-form state MUST be continuously auto-saved to Dexie.js as a "Draft Session". The "Stop Session" button simply finalizes this draft and moves it to the Sync Queue.
8. **Dynamic Gym Grading Config:** Gyms use different grading scales (e.g., V-Grades vs. Color Tags). The backend database must support linking a Gym to a specific "Grade Scale Array". The frontend must fetch this config to dynamically populate the "Climb Grade" dropdown based on the currently selected Gym.
9. **Cross-Row Timer Orchestration:** Starting a "Break" timer must automatically pause any currently running "Climb" timer. Ending a "Break" must check the preceding row, and if it is a paused Climb, automatically resume it. This complex orchestration should be managed in the Zustand store or via higher-level form methods, not isolated component state.
10. **Offline State:** The app must respect a manual "Offline Mode" override switch, not just the native navigator.onLine browser event.
11. **Storage Protection:** To prevent offline images and session data from being cleared by Android/Chrome background eviction policies when the device is low on space, the app MUST request persistent storage via await navigator.storage.persist() on app initialization or when logging a session.
12. **Syncing Process:** When syncing, the client should first compress the image, upload any pending images to R2 (to get the URLs), then submit the JSON payload containing the climb data and image URLs to the Hono API, and finally clear the Dexie.js queue upon success. Retries must be implemented on the network requests.
13. **Native Camera Capture:** To keep bundle size small and utilize hardware-optimized mobile camera interfaces, avoid using heavy React webcam libraries. Use the native HTML5 capture attribute: \<input type="file" accept="image/\*" capture="environment"\>.
14. **Sentry Configuration:** When initializing Sentry on the frontend, tracesSampleRate MUST be set to 0 (or omitted entirely) to prevent performance traces from exhausting the free quota. Furthermore, configure ignoreErrors to filter out expected browser offline events like "Failed to fetch" or "Network Error".
