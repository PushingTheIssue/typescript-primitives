import { describe, expect, it } from 'vitest';
import { BlobStorage } from '../index.js';

describe('BlobStorage.create', () => {
  it('creates the selected in-memory adapter from package-level options', async () => {
    const storage = await BlobStorage.create({ adapter: 'memory' });

    expect(storage.adapter).toBe('memory');
    await storage.put('example.txt', new TextEncoder().encode('hello'), 'text/plain');

    await expect(storage.get('example.txt')).resolves.toMatchObject({ contentType: 'text/plain' });
  });
});
