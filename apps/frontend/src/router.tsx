import {
  createMemoryHistory,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { RequireAuth } from './components/require-auth.js';
import { AccountPage } from './pages/account.js';
import { HistoryPage } from './pages/history.js';
import { SettingsPage } from './pages/settings.js';
import { TrackerPage } from './pages/tracker.js';
import { homeRoute } from './routes/home.js';
import { rootRoute } from './routes/root.js';

export const trackerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tracker',
  component: () => (
    <RequireAuth>
      <TrackerPage />
    </RequireAuth>
  ),
});

export const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/history',
  component: () => (
    <RequireAuth>
      <HistoryPage />
    </RequireAuth>
  ),
});

export const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
});

export const accountRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/account',
  component: AccountPage,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  trackerRoute,
  historyRoute,
  settingsRoute,
  accountRoute,
]);

export interface CreateAppRouterOptions {
  initialEntries?: string[];
}

export function createAppRouter(options: CreateAppRouterOptions = {}) {
  const { initialEntries } = options;

  return createRouter({
    routeTree,
    ...(initialEntries
      ? {
          history: createMemoryHistory({ initialEntries }),
        }
      : {}),
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
