import {
  type AnyRoute,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router';
import { RouteError } from './components/route-error.js';
import { accountRoute } from './routes/account.js';
import { historyDetailRoute } from './routes/history-detail.js';
import { historyRoute } from './routes/history.js';
import { homeRoute } from './routes/home.js';
import { rootRoute } from './routes/root.js';
import { settingsRoute } from './routes/settings.js';
import { trackerRoute } from './routes/tracker.js';

const appRouteChildren = [
  homeRoute,
  trackerRoute,
  historyRoute,
  historyDetailRoute,
  settingsRoute,
  accountRoute,
] as const;

export const createAppRouteTree = (extraRoutes: AnyRoute[] = []) =>
  rootRoute.addChildren([...appRouteChildren, ...extraRoutes]);

export interface CreateAppRouterOptions {
  extraRoutes?: AnyRoute[];
  initialEntries?: string[];
}

export const createAppRouter = (options: CreateAppRouterOptions = {}) => {
  const { extraRoutes = [], initialEntries } = options;

  return createRouter({
    defaultErrorComponent: RouteError,
    routeTree: createAppRouteTree(extraRoutes),
    ...(initialEntries
      ? {
          history: createMemoryHistory({ initialEntries }),
        }
      : {}),
  });
};

export type AppRouter = ReturnType<typeof createAppRouter>;

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
