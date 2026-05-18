import { afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
// Side-effect polyfill for Dexie tests in happy-dom.
// oxlint-disable-next-line import/no-unassigned-import -- IndexedDB polyfill registers globally
import 'fake-indexeddb/auto';
import { Temporal } from '@js-temporal/polyfill';
import { cleanup } from '@testing-library/react';

if (globalThis.Temporal === undefined) {
  globalThis.Temporal = Temporal;
}

// oxlint-disable-next-line vitest/require-top-level-describe -- intentional
afterEach(() => {
  cleanup();
});
