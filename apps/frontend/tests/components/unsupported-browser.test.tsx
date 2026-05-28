import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  UNSUPPORTED_BROWSER_HEADLINE,
  UnsupportedBrowser,
} from '../../src/components/unsupported-browser.js';

describe('unsupported browser screen', () => {
  it('shows the suggested headline and browser name', () => {
    render(
      <UnsupportedBrowser
        browserName="Samsung Internet"
        reason="missing-temporal"
      />,
    );

    expect(screen.getByText(UNSUPPORTED_BROWSER_HEADLINE)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Samsung Internet does not support the JavaScript Temporal API/,
      ),
    ).toBeInTheDocument();
  });
});
