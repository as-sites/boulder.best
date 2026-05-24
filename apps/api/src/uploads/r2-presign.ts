import { S3mini } from 's3mini';

const DEFAULT_PRESIGN_EXPIRY_SECONDS = 3600;

export interface R2PresignConfig {
  accountId: string;
  bucketName: string;
  accessKeyId: string;
  secretAccessKey: string;
}

/** Virtual-hosted R2 endpoint (s3mini + Cloudflare presigned URL examples). */
export const buildR2S3Endpoint = (config: R2PresignConfig): string =>
  `https://${config.bucketName}.${config.accountId}.r2.cloudflarestorage.com`;

const createS3Client = (config: R2PresignConfig): S3mini =>
  new S3mini({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    endpoint: buildR2S3Endpoint(config),
    region: 'auto',
  });

export const createR2PresignedPutUrl = async ({
  config,
  objectKey,
  contentType: _contentType,
  expiresInSeconds = DEFAULT_PRESIGN_EXPIRY_SECONDS,
}: {
  config: R2PresignConfig;
  objectKey: string;
  /** Kept for API symmetry; not signed — see comment in function body. */
  contentType: string;
  expiresInSeconds?: number;
}): Promise<string> => {
  const s3 = createS3Client(config);

  // Per s3mini docs: presign without signed headers; client may send Content-Type.
  // https://codeberg.org/thinking_tools/s3mini#pre-signed-urls
  // R2 expects X-Amz-Content-Sha256=UNSIGNED-PAYLOAD in the query string (AWS SDK parity).
  return await s3.getPresignedUrl('PUT', objectKey, expiresInSeconds, {
    'X-Amz-Content-Sha256': 'UNSIGNED-PAYLOAD',
  });
};
