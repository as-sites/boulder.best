import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import { rootRoute } from './root.js';

export const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about',
  component: lazyRouteComponent(
    async () => await import('../pages/about.js'),
    'AboutPage',
  ),
});
