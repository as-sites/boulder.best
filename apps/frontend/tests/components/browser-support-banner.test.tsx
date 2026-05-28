import { beforeEach, describe, expect, it } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { BrowserSupportBanner } from '../../src/components/browser-support-banner.js';
import {
  BROWSER_SUPPORT_BANNER_DISMISSED_KEY,
  browserSupportBannerDetails,
  browserSupportBannerSummary,
  CHROME_DOWNLOAD_URL,
} from '../../src/lib/browser-support.js';

const renderBanner = () =>
  render(
    <MantineProvider>
      <BrowserSupportBanner />
    </MantineProvider>,
  );

describe('browser support banner', () => {
  beforeEach(() => {
    window.localStorage.clear();
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
      writable: true,
    });
  });

  it('shows the Chrome-only message on unsupported browsers', () => {
    renderBanner();

    expect(screen.getByText(browserSupportBannerSummary)).toBeInTheDocument();
    expect(screen.getByText(browserSupportBannerDetails)).toBeInTheDocument();
    expect(screen.getByText(/You are using Safari/)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'google.com/chrome' }),
    ).toHaveAttribute('href', CHROME_DOWNLOAD_URL);
  });

  it('can be dismissed and stays hidden', () => {
    renderBanner();

    const alert = screen.getByRole('alert');
    fireEvent.click(within(alert).getByRole('button'));

    expect(
      screen.queryByText(browserSupportBannerSummary),
    ).not.toBeInTheDocument();
    expect(
      window.localStorage.getItem(BROWSER_SUPPORT_BANNER_DISMISSED_KEY),
    ).toBe('true');

    renderBanner();
    expect(
      screen.queryByText(browserSupportBannerSummary),
    ).not.toBeInTheDocument();
  });
});
