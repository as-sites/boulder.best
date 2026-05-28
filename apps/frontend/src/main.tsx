import '@mantine/core/styles.css';
import { createRoot } from 'react-dom/client';
import { bootApp } from './boot-app.js';
import { UnsupportedBrowser } from './components/unsupported-browser.js';
import { getBrowserSupportStatus } from './lib/browser-support.js';

const rootElement = document.querySelector('#root');

if (!(rootElement instanceof HTMLElement)) {
  throw new Error('Unable to find the root element.');
}

const browserSupport = getBrowserSupportStatus();

if (!browserSupport.supported) {
  createRoot(rootElement).render(
    <UnsupportedBrowser
      browserName={browserSupport.browserName}
      reason={browserSupport.reason}
    />,
  );
} else {
  void bootApp(rootElement);
}
