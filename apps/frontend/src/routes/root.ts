import { createRootRoute } from '@tanstack/react-router';
import { AppShell } from '../components/app-shell.js';

export const rootRoute = createRootRoute({
  component: AppShell,
});
