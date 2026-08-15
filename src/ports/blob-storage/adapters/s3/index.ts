import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { BlobStorage, type StoredBlob } from '../../index.js';

export class S3BlobStorage extends BlobStorage {
  constructor(private readonly client: S3Client, private readonly bucket: string) {
    super('s3');
  }

  async put(key: string, body: Uint8Array, contentType: string): Promise<{ key: string }> {
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }));
    return { key };
  }

  async get(key: string): Promise<StoredBlob | undefined> {
    try {
      const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
      if (!result.Body) return undefined;
      return { key, contentType: result.ContentType ?? 'application/octet-stream', body: await result.Body.transformToByteArray() };
    } catch (error) {
      const s3Error = error as { name?: string; $metadata?: { httpStatusCode?: number } };
      if (s3Error.name === 'NoSuchKey' || s3Error.name === 'NotFound' || s3Error.$metadata?.httpStatusCode === 404) {
        return undefined;
      }
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
