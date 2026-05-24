import { describe, expect, it } from 'vitest';
import {
  buildR2BucketResource,
  deriveR2SecretAccessKey,
  toCloudflareTimestamp,
} from '../lib/cloudflare-r2-token.ts';

describe('cloudflare-create-api-token helpers', () => {
  it('builds the default-jurisdiction R2 bucket resource key', () => {
    expect(buildR2BucketResource('acc123', 'boulder-dot-best')).toBe(
      'com.cloudflare.edge.r2.bucket.acc123_default_boulder-dot-best',
    );
  });

  it('derives the R2 secret access key as SHA-256 hex of the token value', () => {
    expect(deriveR2SecretAccessKey('test-token-value')).toBe(
      'bc6a34869b72942287fb20fdce092fc392e924b4f1986b5dfa47fbc101e2c7fb',
    );
  });

  it('formats Cloudflare token expiry without fractional seconds', () => {
    expect(toCloudflareTimestamp(new Date('2026-05-24T12:34:56.789Z'))).toBe(
      '2026-05-24T12:34:56Z',
    );
  });
});
