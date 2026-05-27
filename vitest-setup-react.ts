import { afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
// Side-effect polyfill for Dexie tests in happy-dom.
// oxlint-disable-next-line import/no-unassigned-import -- IndexedDB polyfill registers globally
import 'fake-indexeddb/auto';
import { Temporal } from '@js-temporal/polyfill';
import { cleanup } from '@testing-library/react';

// happy-dom doesn't implement document.fonts; Mantine's Autosize Textarea needs it.
// Always define it unconditionally so it isn't left as undefined if happy-dom partially
// initialises the property before our setup runs.
if (typeof document !== 'undefined') {
  Object.defineProperty(document, 'fonts', {
    value: {
      addEventListener: () => {
        /* empty */
      },
      removeEventListener: () => {
        /* empty */
      },
      ready: async () => {
        /* empty */
      },
    },
    configurable: true,
    writable: true,
  });
}

globalThis.Temporal ??= Temporal as unknown as typeof globalThis.Temporal;

// oxlint-disable-next-line vitest/require-top-level-describe -- intentional
afterEach(() => {
  cleanup();
});
