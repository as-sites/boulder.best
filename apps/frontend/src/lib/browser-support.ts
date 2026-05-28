/** Minimum Google Chrome major version (desktop and Android). */
export const MIN_CHROME_VERSION = 144;

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

const parseMajorVersion = (
  userAgent: string,
  pattern: RegExp,
): number | null => {
  const match = pattern.exec(userAgent);
  if (!match?.[1]) {
    return null;
  }

  const version = Number.parseInt(match[1], 10);
  return Number.isFinite(version) ? version : null;
};

/** Human-readable label for the current browser (for unsupported messaging). */
export const getBrowserDisplayName = (userAgent: string): string => {
  if (userAgent.includes('SamsungBrowser')) {
    return 'Samsung Internet';
  }
  if (userAgent.includes('Edg/')) {
    return 'Microsoft Edge';
  }
  if (userAgent.includes('Firefox/')) {
    return 'Firefox';
  }
  if (userAgent.includes('CriOS/')) {
    return 'Chrome';
  }
  if (userAgent.includes('Chrome/')) {
    return 'Chrome';
  }
  if (userAgent.includes('Safari/')) {
    return 'Safari';
  }
  return 'This browser';
};

const getChromeMajorVersion = (userAgent: string): number | null =>
  parseMajorVersion(userAgent, /CriOS\/(\d+)/) ??
  parseMajorVersion(userAgent, /Chrome\/(\d+)/);

/** True when the user agent is Google Chrome (not Edge, Opera, Samsung, etc.). */
export const isGoogleChromeUserAgent = (userAgent: string): boolean => {
  if (userAgent.includes('Firefox/')) {
    return false;
  }
  if (userAgent.includes('SamsungBrowser')) {
    return false;
  }
  if (userAgent.includes('Edg/')) {
    return false;
  }
  if (userAgent.includes('OPR/')) {
    return false;
  }
  if (
    userAgent.includes('Safari/') &&
    !userAgent.includes('Chrome/') &&
    !userAgent.includes('CriOS/')
  ) {
    return false;
  }

  return getChromeMajorVersion(userAgent) !== null;
};

/**
 * Returns whether this browser can run Boulder Best. Must stay free of Temporal
 * imports — safe to call before the app bundle loads.
 */
export const getBrowserSupportStatus = (
  userAgent: string = navigator.userAgent,
  hasTemporal: boolean = 'Temporal' in globalThis,
): BrowserSupportStatus => {
  const browserName = getBrowserDisplayName(userAgent);

  if (!isGoogleChromeUserAgent(userAgent)) {
    return {
      supported: false,
      reason: 'not-chrome',
      browserName,
    };
  }

  const chromeVersion = getChromeMajorVersion(userAgent);
  if (chromeVersion === null || chromeVersion < MIN_CHROME_VERSION) {
    return {
      supported: false,
      reason: 'outdated-chrome',
      browserName,
    };
  }

  if (!hasTemporal) {
    return {
      supported: false,
      reason: 'missing-temporal',
      browserName,
    };
  }

  return { supported: true };
};

export const isBrowserSupported = (
  userAgent?: string,
  hasTemporal?: boolean,
): boolean => getBrowserSupportStatus(userAgent, hasTemporal).supported;
