import { createRoot, type Root } from 'react-dom/client';
import { wrapAppRoot } from './bootstrap-root.js';
import { isBrowserSupported } from './lib/browser-support.js';
import { initSentry } from './lib/sentry.js';
import { requestPersistentStorage } from './offline/index.js';
import { registerPwaServiceWorker } from './register-pwa.js';

export const bootApp = async (rootElement: HTMLElement): Promise<Root> => {
  initSentry();
  void requestPersistentStorage();
  if (isBrowserSupported()) {
    registerPwaServiceWorker();
  }

  const { App } = await import('./app.js');
  const root = createRoot(rootElement);
  root.render(wrapAppRoot(<App />));
  return root;
};
