import { BrowserDetector } from 'browser-dtector';

/** Minimum Google Chrome major version (desktop and Android). */
export const MIN_CHROME_VERSION = 144;

export const CHROME_DOWNLOAD_URL = 'https://google.com/chrome';

/** Lead sentence for the unsupported-browser banner. */
export const browserSupportBannerSummary = `Boulder Best officially supports Google Chrome ${MIN_CHROME_VERSION}+ on desktop and Android.`;

/**
 * Unsupported platforms and browsers (banner). iOS is not supported as a
 * platform; Chrome on iOS is called out separately because it may still work.
 */
export const browserSupportBannerDetails =
  'Safari is not supported. iOS is not supported. Firefox may work but is not supported. Chrome on iOS may work but is not supported.';

/** Full banner body (summary + details). */
export const browserSupportBannerMessage = `${browserSupportBannerSummary} ${browserSupportBannerDetails}`;

export const BROWSER_SUPPORT_BANNER_DISMISSED_KEY =
  'boulder.browserSupportBanner.dismissed';

export type UnsupportedBrowserReason =
  | 'not-chrome'
  | 'outdated-chrome'
  | 'missing-temporal';

export type BrowserSupportStatus =
  | { supported: true }
  | {
      supported: false;
      reason: UnsupportedBrowserReason;
      browserName: string;
    };

/**
 * Returns whether this browser can run Boulder Best. Must stay free of Temporal
 * imports — safe to call before the app bundle loads.
 */
export const getBrowserSupportStatus = (
  userAgent: string = navigator.userAgent,
  hasTemporal: boolean = 'Temporal' in globalThis,
): BrowserSupportStatus => {
  const { name, shortVersion } = new BrowserDetector(
    userAgent,
  ).parseUserAgent();
  const browserName = name ?? 'This browser';

  if (name !== 'Google Chrome') {
    return { supported: false, reason: 'not-chrome', browserName };
  }

  const version = Number.parseInt(shortVersion ?? '', 10);
  if (!Number.isFinite(version) || version < MIN_CHROME_VERSION) {
    return { supported: false, reason: 'outdated-chrome', browserName };
  }

  if (!hasTemporal) {
    return { supported: false, reason: 'missing-temporal', browserName };
  }

  return { supported: true };
};

export const isBrowserSupported = (
  userAgent?: string,
  hasTemporal?: boolean,
): boolean => getBrowserSupportStatus(userAgent, hasTemporal).supported;
