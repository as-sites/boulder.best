import { describe, expect, it } from 'vitest';
import {
  getBrowserDisplayName,
  getBrowserSupportStatus,
  isGoogleChromeUserAgent,
  MIN_CHROME_VERSION,
} from '../../src/lib/browser-support.js';

const samsungUa =
  'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36';

const chromeUa = (version: number) =>
  `Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/${version}.0.0.0 Mobile Safari/537.36`;

describe('browser display name', () => {
  it('labels Samsung Internet from the user agent', () => {
    expect(getBrowserDisplayName(samsungUa)).toBe('Samsung Internet');
  });
});

describe('Google Chrome user agent detection', () => {
  it('accepts Chrome user agents', () => {
    expect(isGoogleChromeUserAgent(chromeUa(MIN_CHROME_VERSION))).toBe(true);
  });

  it('rejects Firefox', () => {
    expect(
      isGoogleChromeUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; rv:150.0) Gecko/20100101 Firefox/150.0',
      ),
    ).toBe(false);
  });

  it('rejects Safari', () => {
    expect(
      isGoogleChromeUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
      ),
    ).toBe(false);
  });
});

describe('browser support status', () => {
  it('rejects Samsung Internet', () => {
    expect(getBrowserSupportStatus(samsungUa, true)).toEqual({
      supported: false,
      reason: 'not-chrome',
      browserName: 'Samsung Internet',
    });
  });

  it('rejects Firefox even with Temporal', () => {
    expect(
      getBrowserSupportStatus(
        'Mozilla/5.0 (Windows NT 10.0; rv:150.0) Gecko/20100101 Firefox/150.0',
        true,
      ),
    ).toEqual({
      supported: false,
      reason: 'not-chrome',
      browserName: 'Firefox',
    });
  });

  it('rejects Safari', () => {
    expect(
      getBrowserSupportStatus(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        true,
      ),
    ).toEqual({
      supported: false,
      reason: 'not-chrome',
      browserName: 'Safari',
    });
  });

  it('accepts recent Chrome with Temporal', () => {
    expect(getBrowserSupportStatus(chromeUa(MIN_CHROME_VERSION), true)).toEqual(
      {
        supported: true,
      },
    );
  });

  it('rejects outdated Chrome', () => {
    expect(getBrowserSupportStatus(chromeUa(120), true)).toEqual({
      supported: false,
      reason: 'outdated-chrome',
      browserName: 'Chrome',
    });
  });

  it('rejects Chrome without Temporal', () => {
    expect(
      getBrowserSupportStatus(chromeUa(MIN_CHROME_VERSION), false),
    ).toEqual({
      supported: false,
      reason: 'missing-temporal',
      browserName: 'Chrome',
    });
  });
});
