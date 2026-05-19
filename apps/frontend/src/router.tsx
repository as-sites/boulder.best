import { createMemoryHistory, createRouter } from '@tanstack/react-router';
import { accountRoute } from './routes/account.js';
import { historyDetailRoute } from './routes/history-detail.js';
import { historyRoute } from './routes/history.js';
import { homeRoute } from './routes/home.js';
import { rootRoute } from './routes/root.js';
import { settingsRoute } from './routes/settings.js';
import { trackerRoute } from './routes/tracker.js';

const routeTree = rootRoute.addChildren([
  homeRoute,
  trackerRoute,
  historyRoute,
  historyDetailRoute,
  settingsRoute,
  accountRoute,
]);

export interface CreateAppRouterOptions {
  initialEntries?: string[];
}

export const createAppRouter = (options: CreateAppRouterOptions = {}) => {
  const { initialEntries } = options;

  return createRouter({
    routeTree,
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
