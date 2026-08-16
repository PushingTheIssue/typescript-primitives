import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { BlobStorage, type StoredBlob } from '../../index.js';
import type { Telemetry } from '../../../telemetry/index.js';
import { observe } from '../../../../internal/telemetry.js';

export class S3BlobStorage extends BlobStorage {
  constructor(private readonly client: S3Client, private readonly bucket: string, private readonly telemetry?: Telemetry) {
    super('s3');
  }

  async put(key: string, body: Uint8Array, contentType: string): Promise<{ key: string }> {
    return observe(this.telemetry, 'blob', this.adapter, 'put', async () => {
      await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }));
      return { key };
    }, { contentType, bytes: body.byteLength });
  }

  async get(key: string): Promise<StoredBlob | undefined> {
    return observe(this.telemetry, 'blob', this.adapter, 'get', async () => {
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
    });
  }

  async delete(key: string): Promise<void> {
    return observe(this.telemetry, 'blob', this.adapter, 'delete', async () => {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    });
  }
}
