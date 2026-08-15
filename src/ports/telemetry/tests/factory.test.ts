import { describe, expect, it } from 'vitest';
import { Telemetry } from '../index.js';

describe('Telemetry.create', () => {
  it('creates the OpenTelemetry adapter', async () => {
    const telemetry = await Telemetry.create({ adapter: 'otel', serviceName: 'lab' });
    expect(telemetry.adapter).toBe('otel');
  });

  it('rejects unsupported runtime adapter values', async () => {
    await expect(Telemetry.create({ adapter: 'custom' } as never))
      .rejects.toThrow('Unsupported telemetry adapter: custom');
  });
});
