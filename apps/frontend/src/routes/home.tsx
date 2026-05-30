import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import { rootRoute } from './root.js';

export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: lazyRouteComponent(
    async () => await import('../pages/home.js'),
    'HomePage',
  ),
});
