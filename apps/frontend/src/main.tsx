import '@mantine/core/styles.css';
import { createRoot } from 'react-dom/client';
import { App } from './app.js';
import { requestPersistentStorage } from './offline/index.js';

void requestPersistentStorage();

const rootElement = document.querySelector('#root');

if (!rootElement) {
  throw new Error('Unable to find the root element.');
}

createRoot(rootElement).render(<App />);
