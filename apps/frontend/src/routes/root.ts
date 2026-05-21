import { createRootRoute } from '@tanstack/react-router';
import { AppShell } from '../components/app-shell.js';
import { RouteError } from '../components/route-error.js';
import { RouteNotFound } from '../components/route-not-found.js';

export const rootRoute = createRootRoute({
  component: AppShell,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});
