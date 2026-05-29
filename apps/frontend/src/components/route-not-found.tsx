import { StatusPanel } from './status-panel.js';

/** Router-level 404 shown inside AppShell when no route matches. */
export const RouteNotFound = () => <StatusPanel variant="not-found" />;
