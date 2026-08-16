import { describe, expect, it } from 'vitest';
import { Telemetry } from '../index.js';

describe('Telemetry.create', () => {
  it('creates the OpenTelemetry adapter', async () => {
    const telemetry = await Telemetry.create({
      adapter: 'otel',
      serviceName: 'lab',
      endpoint: 'http://localhost:4318',
      headers: { Authorization: 'Bearer test' },
    });
    expect(telemetry.adapter).toBe('otel');
    await expect(telemetry.shutdown()).resolves.toBeUndefined();
  });

  it('reuses the adapter-owned providers across factory calls', async () => {
    const first = await Telemetry.create({ adapter: 'otel', serviceName: 'first' });
    const second = await Telemetry.create({ adapter: 'otel', serviceName: 'second' });

    await expect(Promise.all([first.shutdown(), second.shutdown()])).resolves.toEqual([undefined, undefined]);
  });

  it('rejects unsupported runtime adapter values', async () => {
    await expect(Telemetry.create({ adapter: 'custom' } as never))
      .rejects.toThrow('Unsupported telemetry adapter: custom');
  });
});
