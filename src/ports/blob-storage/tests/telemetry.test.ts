import { describe, expect, it, vi } from 'vitest';
import { BlobStorage } from '../index.js';
import { S3BlobStorage } from '../adapters/s3/index.js';
import type { Telemetry } from '../../telemetry/index.js';

describe('BlobStorage telemetry', () => {
  it('records successful and failed operations without recording blob content', async () => {
    const telemetry = {
      span: vi.fn(async (_name: string, work: () => Promise<unknown>) => work()),
      increment: vi.fn(),
      log: vi.fn(),
    } as unknown as Telemetry;
    const storage = await BlobStorage.create({ adapter: 'memory', telemetry });

    await storage.put('key', new Uint8Array([1, 2]), 'image/png');
    await storage.get('key');
    await storage.delete('key');

    expect(telemetry.span).toHaveBeenCalledWith('pti.blob.put', expect.any(Function), {
      port: 'blob', adapter: 'memory', operation: 'put', contentType: 'image/png', bytes: 2,
    });
    expect(telemetry.increment).toHaveBeenCalledTimes(3);
    expect(telemetry.log).not.toHaveBeenCalled();
  });

  it('logs adapter failures and counts them', async () => {
    const telemetry = {
      span: vi.fn(async (_name: string, work: () => Promise<unknown>) => work()),
      increment: vi.fn(),
      log: vi.fn(),
    } as unknown as Telemetry;
    const storage = new S3BlobStorage(
      { send: vi.fn().mockRejectedValue(new Error('unavailable')) } as never,
      'bucket',
      telemetry,
    );

    await expect(storage.delete('key')).rejects.toThrow('unavailable');
    expect(telemetry.span).toHaveBeenCalledWith('pti.blob.delete', expect.any(Function), {
      port: 'blob', adapter: 's3', operation: 'delete',
    });
    expect(telemetry.increment).toHaveBeenCalledWith('pti.operation.count', 1, {
      port: 'blob', adapter: 's3', operation: 'delete', status: 'error',
    });
    expect(telemetry.log).toHaveBeenCalledWith(
      'error', 'blob delete failed', { port: 'blob', adapter: 's3', operation: 'delete' }, expect.any(Error),
    );
  });
});
