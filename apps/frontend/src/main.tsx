import '@mantine/core/styles.css';
import { bootApp } from './boot-app.js';

const rootElement = document.querySelector('#root');

if (!(rootElement instanceof HTMLElement)) {
  throw new Error('Unable to find the root element.');
}

void bootApp(rootElement);
