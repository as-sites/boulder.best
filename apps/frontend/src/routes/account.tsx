import { createRoute } from '@tanstack/react-router';
import { AccountPage } from '../pages/account.js';
import { rootRoute } from './root.js';

export const accountRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/account',
  component: AccountPage,
});
