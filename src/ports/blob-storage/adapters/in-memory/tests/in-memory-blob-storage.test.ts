import { describe, expect, it } from 'vitest';
import { InMemoryBlobStorage } from '../index.js';

describe('InMemoryBlobStorage', () => {
  it('stores and retrieves an independent copy of a blob', async () => {
    const storage = new InMemoryBlobStorage();
    const body = new TextEncoder().encode('hello');

    expect(storage.adapter).toBe('memory');
    await expect(storage.put('example.txt', body, 'text/plain')).resolves.toEqual({ key: 'example.txt' });
    body[0] = 0;

    await expect(storage.get('example.txt')).resolves.toEqual({
      key: 'example.txt',
      contentType: 'text/plain',
      body: new TextEncoder().encode('hello'),
    });
  });

  it('does not expose stored bytes and supports deletion', async () => {
    const storage = new InMemoryBlobStorage();
    await storage.put('example.txt', new Uint8Array([1, 2]), 'application/octet-stream');

    const blob = await storage.get('example.txt');
    blob?.body.fill(0);

    await expect(storage.get('example.txt')).resolves.toMatchObject({ body: new Uint8Array([1, 2]) });
    await expect(storage.delete('example.txt')).resolves.toBeUndefined();
    await expect(storage.get('example.txt')).resolves.toBeUndefined();
  });
});
