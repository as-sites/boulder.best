import { StrictMode, type ReactElement } from 'react';

/** Wrap the app root for the current build environment (StrictMode in dev only). */
export const wrapAppRoot = (
  app: ReactElement,
  isDev = import.meta.env.DEV,
): ReactElement => (isDev ? <StrictMode>{app}</StrictMode> : app);
