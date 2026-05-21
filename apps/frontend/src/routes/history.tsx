import { createRoute } from '@tanstack/react-router';
import { HistoryPage } from '../pages/history.js';
import { rootRoute } from './root.js';

export const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/history',
  component: HistoryPage,
});
