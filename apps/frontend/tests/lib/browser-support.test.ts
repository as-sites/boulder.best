import { describe, expect, it } from 'vitest';
import {
  getBrowserDisplayName,
  getBrowserSupportStatus,
  MIN_CHROMIUM_VERSION,
  MIN_EDGE_VERSION,
  MIN_FIREFOX_VERSION,
} from '../../src/lib/browser-support.js';

const samsungUa =
  'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36';

describe('browser display name', () => {
  it('labels Samsung Internet from the user agent', () => {
    expect(getBrowserDisplayName(samsungUa)).toBe('Samsung Internet');
  });
});

describe('browser support status', () => {
  it('rejects browsers without Temporal (e.g. Samsung Internet)', () => {
    expect(getBrowserSupportStatus(samsungUa, false)).toEqual({
      supported: false,
      reason: 'missing-temporal',
      browserName: 'Samsung Internet',
    });
  });

  it('accepts recent Chrome with Temporal', () => {
    expect(
      getBrowserSupportStatus(
        `Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/${MIN_CHROMIUM_VERSION}.0.0.0 Mobile Safari/537.36`,
        true,
      ),
    ).toEqual({ supported: true });
  });

  it('accepts recent Edge with Temporal', () => {
    expect(
      getBrowserSupportStatus(
        `Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/${MIN_CHROMIUM_VERSION}.0.0.0 Safari/537.36 Edg/${MIN_EDGE_VERSION}.0.0.0`,
        true,
      ),
    ).toEqual({ supported: true });
  });

  it('accepts recent Firefox with Temporal', () => {
    expect(
      getBrowserSupportStatus(
        `Mozilla/5.0 (Windows NT 10.0; rv:${MIN_FIREFOX_VERSION}.0) Gecko/20100101 Firefox/${MIN_FIREFOX_VERSION}.0`,
        true,
      ),
    ).toEqual({ supported: true });
  });

  it('rejects outdated Chrome even when Temporal is present', () => {
    expect(
      getBrowserSupportStatus(
        'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36',
        true,
      ),
    ).toEqual({
      supported: false,
      reason: 'outdated-browser',
      browserName: 'Chrome',
    });
  });
});
