import { S3mini } from 's3mini';

const DEFAULT_PRESIGN_EXPIRY_SECONDS = 3600;

export interface R2PresignConfig {
  accountId: string;
  bucketName: string;
  accessKeyId: string;
  secretAccessKey: string;
}

const createS3Client = (config: R2PresignConfig): S3mini =>
  new S3mini({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucketName}`,
    region: 'auto',
  });

export const createR2PresignedPutUrl = async ({
  config,
  objectKey,
  contentType,
  contentLength,
  expiresInSeconds = DEFAULT_PRESIGN_EXPIRY_SECONDS,
}: {
  config: R2PresignConfig;
  objectKey: string;
  contentType: string;
  contentLength: number;
  expiresInSeconds?: number;
}): Promise<string> => {
  const s3 = createS3Client(config);

  return await s3.getPresignedUrl(
    'PUT',
    objectKey,
    expiresInSeconds,
    {},
    {
      'Content-Type': contentType,
      'Content-Length': String(contentLength),
    },
  );
};
