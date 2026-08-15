import { describe, expect, it } from 'vitest';
import { Telemetry } from '../index.js';

describe('Telemetry', () => {
  it('exposes the adapter selected by a concrete implementation', () => {
    class TestTelemetry extends Telemetry {
      constructor() { super('test'); }
      async span<T>(_name: string, work: () => Promise<T>): Promise<T> { return work(); }
      increment(): void {}
      log(): void {}
    }

    expect(new TestTelemetry().adapter).toBe('test');
  });
});
