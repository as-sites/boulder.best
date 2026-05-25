import { createRoute } from '@tanstack/react-router';
import { SessionDetailPage } from '../pages/session-detail.js';
import { rootRoute } from './root.js';

export const sessionDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sessions/$sessionId',
  component: SessionDetailPage,
});
