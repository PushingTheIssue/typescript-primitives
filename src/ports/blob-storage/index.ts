export interface StoredBlob {
  readonly key: string;
  readonly contentType: string;
  readonly body: Uint8Array;
}

export type BlobStorageOptions =
  | { readonly adapter: 'memory'; readonly telemetry?: Telemetry }
  | { readonly adapter: 's3'; readonly bucket: string; readonly region?: string; readonly telemetry?: Telemetry };

export abstract class BlobStorage {
  constructor(public readonly adapter: string) {}

  static async create(options: BlobStorageOptions): Promise<BlobStorage> {
    if (options.adapter === 'memory') {
      const { InMemoryBlobStorage } = await import('./adapters/in-memory/index.js');
      return new InMemoryBlobStorage(options.telemetry);
    }

    if (options.adapter === 's3') {
      const [{ S3Client }, { S3BlobStorage }] = await Promise.all([
        import('@aws-sdk/client-s3'),
        import('./adapters/s3/index.js'),
      ]);
      const client = options.region ? new S3Client({ region: options.region }) : new S3Client({});
      return new S3BlobStorage(client, options.bucket, options.telemetry);
    }

    throw new Error(`Unsupported blob storage adapter: ${(options as { adapter: string }).adapter}`);
  }

  abstract put(key: string, body: Uint8Array, contentType: string): Promise<{ key: string }>;
  abstract get(key: string): Promise<StoredBlob | undefined>;
  abstract delete(key: string): Promise<void>;
}
import type { Telemetry } from '../telemetry/index.js';
