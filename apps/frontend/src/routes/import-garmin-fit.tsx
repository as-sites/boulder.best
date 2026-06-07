import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import { rootRoute } from './root.js';

export const importGarminFitRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings/import-garmin-fit',
  component: lazyRouteComponent(
    async () => await import('../pages/import-garmin-fit.js'),
    'ImportGarminFitPage',
  ),
});
