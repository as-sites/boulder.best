import { createRoute } from '@tanstack/react-router';
import { SettingsPage } from '../pages/settings.js';
import { rootRoute } from './root.js';

export const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
});
