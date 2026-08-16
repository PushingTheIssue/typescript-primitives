import { BlobStorage, type StoredBlob } from '../../index.js';
import type { Telemetry } from '../../../telemetry/index.js';
import { observe } from '../../../../internal/telemetry.js';

export class InMemoryBlobStorage extends BlobStorage {
  private readonly blobs = new Map<string, StoredBlob>();

  constructor(private readonly telemetry?: Telemetry) {
    super('memory');
  }

  async put(key: string, body: Uint8Array, contentType: string): Promise<{ key: string }> {
    return observe(this.telemetry, 'blob', this.adapter, 'put', async () => {
      this.blobs.set(key, { key, contentType, body: body.slice() });
      return { key };
    }, { contentType, bytes: body.byteLength });
  }

  async get(key: string): Promise<StoredBlob | undefined> {
    return observe(this.telemetry, 'blob', this.adapter, 'get', async () => {
      const blob = this.blobs.get(key);
      return blob ? { ...blob, body: blob.body.slice() } : undefined;
    });
  }

  async delete(key: string): Promise<void> {
    return observe(this.telemetry, 'blob', this.adapter, 'delete', async () => {
      this.blobs.delete(key);
    });
  }
}
