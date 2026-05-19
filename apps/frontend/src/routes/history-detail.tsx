import { createRoute } from '@tanstack/react-router';
import { HistoryDetailPage } from '../pages/history-detail.js';
import { rootRoute } from './root.js';
import { withAuth } from './with-auth.js';

export const historyDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/history/$sessionId',
  component: withAuth(HistoryDetailPage),
});
