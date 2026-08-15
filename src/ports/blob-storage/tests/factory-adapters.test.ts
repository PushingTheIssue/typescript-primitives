import { describe, expect, it } from 'vitest';
import { BlobStorage } from '../index.js';

describe('BlobStorage.create adapters', () => {
  it('creates the S3 adapter with its bucket and region options', async () => {
    const storage = await BlobStorage.create({
      adapter: 's3',
      bucket: 'test-bucket',
      region: 'eu-west-1',
    });

    expect(storage.adapter).toBe('s3');
  });

  it('rejects unsupported runtime adapter values', async () => {
    await expect(BlobStorage.create({ adapter: 'azure' } as never))
      .rejects.toThrow('Unsupported blob storage adapter: azure');
  });
});
