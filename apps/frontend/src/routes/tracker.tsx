import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import { rootRoute } from './root.js';

export const trackerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tracker',
  component: lazyRouteComponent(
    async () => await import('../pages/tracker.js'),
    'TrackerPage',
  ),
});
