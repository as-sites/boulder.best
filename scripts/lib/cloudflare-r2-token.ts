import { createHash } from 'node:crypto';

/** Cloudflare expects UTC timestamps without fractional seconds. */
export const toCloudflareTimestamp = (date: Date): string =>
  date.toISOString().replace(/\.\d{3}Z$/, 'Z');

/** R2 bucket resource key for account API token policies. */
export const buildR2BucketResource = (
  accountId: string,
  bucketName: string,
  jurisdiction = 'default',
): string =>
  `com.cloudflare.edge.r2.bucket.${accountId}_${jurisdiction}_${bucketName}`;

/** S3 secret derived from an R2 API token value (Cloudflare R2 docs). */
export const deriveR2SecretAccessKey = (tokenValue: string): string =>
  createHash('sha256').update(tokenValue, 'utf8').digest('hex');
