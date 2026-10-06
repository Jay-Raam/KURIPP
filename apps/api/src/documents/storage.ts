import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env';

export const s3Client = new S3Client({
  region: env.S3_REGION || 'auto',
  endpoint: env.S3_ENDPOINT || undefined,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: env.S3_FORCE_PATH_STYLE,
});

export const StorageService = {
  /**
   * Generates a presigned PUT URL for direct client-to-storage upload.
   */
  async getPresignedUploadUrl(
    objectKey: string,
    contentType: string,
    expiresInSeconds = 900 // 15 minutes
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: objectKey,
      ContentType: contentType,
    });

    return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
  },

  /**
   * Generates a presigned GET URL for secure authenticated document download.
   */
  async getPresignedDownloadUrl(
    objectKey: string,
    expiresInSeconds = 900 // 15 minutes
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: objectKey,
    });

    return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
  },

  /**
   * Deletes an object from S3 / R2 storage.
   */
  async deleteObject(objectKey: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: objectKey,
      });
      await s3Client.send(command);
    } catch (error) {
      console.warn(`[StorageService] Failed to delete object ${objectKey}:`, error);
    }
  },
};
