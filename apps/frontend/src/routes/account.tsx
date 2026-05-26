import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import { rootRoute } from './root.js';

export const accountRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/account',
  component: lazyRouteComponent(
    async () => await import('../pages/account.js'),
    'AccountPage',
  ),
});
