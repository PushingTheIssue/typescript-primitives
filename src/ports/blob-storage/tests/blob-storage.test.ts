import { describe, expect, it } from 'vitest';
import { BlobStorage } from '../index.js';

describe('BlobStorage', () => {
  it('exposes the adapter selected by a concrete implementation', () => {
    class TestBlobStorage extends BlobStorage {
      constructor() {
        super('test');
      }

      async put(): Promise<{ key: string }> { return { key: 'test' }; }
      async get() { return undefined; }
      async delete(): Promise<void> {}
    }

    expect(new TestBlobStorage().adapter).toBe('test');
  });
});
