import { describe, expect, it, vi } from 'vitest';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { S3BlobStorage } from '../index.js';

type Command = { input: Record<string, unknown> };

describe('S3BlobStorage', () => {
  it('sends put, get, and delete commands to the configured bucket', async () => {
    const send = vi.fn(async (command: Command) => {
      if (command instanceof PutObjectCommand) return { ETag: 'etag' };
      if (command instanceof GetObjectCommand) {
        return {
          ContentType: 'text/plain',
          Body: { transformToByteArray: async () => new TextEncoder().encode('hello') },
        };
      }
      return {};
    });
    const storage = new S3BlobStorage({ send } as never, 'test-bucket');
    const body = new TextEncoder().encode('hello');

    expect(storage.adapter).toBe('s3');
    await expect(storage.put('example.txt', body, 'text/plain')).resolves.toEqual({ key: 'example.txt' });
    await expect(storage.get('example.txt')).resolves.toEqual({
      key: 'example.txt',
      contentType: 'text/plain',
      body,
    });
    await expect(storage.delete('example.txt')).resolves.toBeUndefined();

    expect(send).toHaveBeenCalledTimes(3);
    expect(send.mock.calls.map(([command]) => command.input)).toEqual([
      { Bucket: 'test-bucket', Key: 'example.txt', Body: body, ContentType: 'text/plain' },
      { Bucket: 'test-bucket', Key: 'example.txt' },
      { Bucket: 'test-bucket', Key: 'example.txt' },
    ]);
  });

  it('returns undefined for missing objects and rethrows other errors', async () => {
    const send = vi.fn()
      .mockRejectedValueOnce(Object.assign(new Error('missing'), { name: 'NoSuchKey' }))
      .mockRejectedValueOnce(new Error('failed'));
    const storage = new S3BlobStorage({ send } as never, 'test-bucket');

    await expect(storage.get('missing.txt')).resolves.toBeUndefined();
    await expect(storage.get('broken.txt')).rejects.toThrow('failed');
  });
});
