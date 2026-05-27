import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { createRoot } from 'react-dom/client';
import { App } from './app.js';
import { wrapAppRoot } from './bootstrap-root.js';
import { initSentry } from './lib/sentry.js';
import { requestPersistentStorage } from './offline/index.js';

initSentry();
void requestPersistentStorage();

const rootElement = document.querySelector('#root');

if (!rootElement) {
  throw new Error('Unable to find the root element.');
}

createRoot(rootElement).render(wrapAppRoot(<App />));
