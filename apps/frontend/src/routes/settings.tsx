import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import { rootRoute } from './root.js';

export const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: lazyRouteComponent(
    async () => await import('../pages/settings.js'),
    'SettingsPage',
  ),
});
