import { BlobStorage, type StoredBlob } from '../../index.js';

export class InMemoryBlobStorage extends BlobStorage {
  private readonly blobs = new Map<string, StoredBlob>();

  constructor() {
    super('memory');
  }

  async put(key: string, body: Uint8Array, contentType: string): Promise<{ key: string }> {
    this.blobs.set(key, { key, contentType, body: body.slice() });
    return { key };
  }

  async get(key: string): Promise<StoredBlob | undefined> {
    const blob = this.blobs.get(key);
    return blob ? { ...blob, body: blob.body.slice() } : undefined;
  }

  async delete(key: string): Promise<void> {
    this.blobs.delete(key);
  }
}
