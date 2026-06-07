import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import { rootRoute } from './root.js';

export const sessionDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/history/$sessionId',
  component: lazyRouteComponent(
    async () => await import('../pages/session-detail.js'),
    'SessionDetailPage',
  ),
});
