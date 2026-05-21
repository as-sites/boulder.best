import { createRoute } from '@tanstack/react-router';
import { HistoryDetailPage } from '../pages/history-detail.js';
import { rootRoute } from './root.js';

export const historyDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/history/$sessionId',
  component: HistoryDetailPage,
});
