import { createRoute } from '@tanstack/react-router';
import { HistoryPage } from '../pages/history.js';
import { rootRoute } from './root.js';

export const sessionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sessions',
  component: HistoryPage,
});
