import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// oxlint-disable-next-line vitest/require-top-level-describe -- intentional
afterEach(() => {
  cleanup();
});
