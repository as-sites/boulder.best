import '@testing-library/jest-dom/vitest';
// Side-effect polyfill for Dexie tests in happy-dom.
// oxlint-disable-next-line import/no-unassigned-import -- IndexedDB polyfill registers globally
import 'fake-indexeddb/auto';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// oxlint-disable-next-line vitest/require-top-level-describe -- intentional
afterEach(() => {
  cleanup();
});
