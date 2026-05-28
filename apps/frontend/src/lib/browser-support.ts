/**
 * Minimum Chromium major version with native Temporal (Chrome / Edge /
 * Samsung).
 */
export const MIN_CHROMIUM_VERSION = 148;

/** Minimum Firefox major version with native Temporal. */
export const MIN_FIREFOX_VERSION = 139;

/** Minimum Edge major version with native Temporal (`Edg/` token). */
export const MIN_EDGE_VERSION = 144;

export type UnsupportedBrowserReason = 'missing-temporal' | 'outdated-browser';

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
  if (userAgent.includes('Chrome/')) {
    return 'Chrome';
  }
  if (userAgent.includes('Safari/')) {
    return 'Safari';
  }
  return 'This browser';
};

const meetsMinimumBrowserVersions = (userAgent: string): boolean => {
  const firefoxVersion = parseMajorVersion(userAgent, /Firefox\/(\d+)/);
  if (firefoxVersion !== null) {
    return firefoxVersion >= MIN_FIREFOX_VERSION;
  }

  const edgeVersion = parseMajorVersion(userAgent, /Edg\/(\d+)/);
  if (edgeVersion !== null) {
    return edgeVersion >= MIN_EDGE_VERSION;
  }

  const chromeVersion = parseMajorVersion(userAgent, /Chrome\/(\d+)/);
  if (chromeVersion !== null) {
    return chromeVersion >= MIN_CHROMIUM_VERSION;
  }

  // Unknown UA: Temporal presence is the only signal we have.
  return true;
};

/**
 * Returns whether this browser can run Boulder Best. Must stay free of Temporal
 * imports — called before the app bundle loads.
 */
export const getBrowserSupportStatus = (
  userAgent: string = navigator.userAgent,
  hasTemporal: boolean = 'Temporal' in globalThis,
): BrowserSupportStatus => {
  const browserName = getBrowserDisplayName(userAgent);

  if (!hasTemporal) {
    return {
      supported: false,
      reason: 'missing-temporal',
      browserName,
    };
  }

  if (!meetsMinimumBrowserVersions(userAgent)) {
    return {
      supported: false,
      reason: 'outdated-browser',
      browserName,
    };
  }

  return { supported: true };
};

export const isBrowserSupported = (
  userAgent?: string,
  hasTemporal?: boolean,
): boolean => getBrowserSupportStatus(userAgent, hasTemporal).supported;
