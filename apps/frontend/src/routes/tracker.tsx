import { createRoute } from '@tanstack/react-router';
import { TrackerPage } from '../pages/tracker.js';
import { rootRoute } from './root.js';
import { withAuth } from './with-auth.js';

export const trackerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tracker',
  component: withAuth(TrackerPage),
});
