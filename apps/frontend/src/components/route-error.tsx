import type { ErrorComponentProps } from '@tanstack/react-router';
import { StatusPanel } from './status-panel.js';

/**
 * Router-level error boundary shown inside AppShell for uncaught route
 * failures.
 */
export const RouteError = ({ error, reset }: ErrorComponentProps) => (
  <StatusPanel variant="error" error={error} onRetry={reset} />
);
