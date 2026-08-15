import { describe, expect, it, vi } from 'vitest';
import { SeverityNumber } from '@opentelemetry/api-logs';
import { OtelTelemetry } from '../index.js';

interface TestSpan {
  end: () => void;
  recordException: (error: Error) => void;
  setStatus: (status: unknown) => void;
}

describe('OtelTelemetry', () => {
  it('runs work in a span and closes it', async () => {
    const span = { end: vi.fn(), recordException: vi.fn(), setStatus: vi.fn() };
    const startActiveSpan = vi.fn(async (_name: string, _options: unknown, work: (span: TestSpan) => Promise<string>) => work(span));
    const telemetry = new OtelTelemetry('lab', { startActiveSpan } as never, { createCounter: vi.fn() } as never);

    await expect(telemetry.span('lab.operation', async () => 'done', { component: 'test' })).resolves.toBe('done');
    expect(startActiveSpan).toHaveBeenCalledWith('lab.operation', { attributes: { component: 'test' } }, expect.any(Function));
    expect(span.end).toHaveBeenCalledOnce();
  });

  it('records errors and closes failed spans', async () => {
    const span = { end: vi.fn(), recordException: vi.fn(), setStatus: vi.fn() };
    const startActiveSpan = vi.fn(async (_name: string, _options: unknown, work: (span: TestSpan) => Promise<never>) => work(span));
    const telemetry = new OtelTelemetry('lab', { startActiveSpan } as never, { createCounter: vi.fn() } as never);

    await expect(telemetry.span('lab.operation', async () => { throw new Error('failed'); }))
      .rejects.toThrow('failed');
    expect(span.recordException).toHaveBeenCalledOnce();
    expect(span.setStatus).toHaveBeenCalledOnce();
    expect(span.end).toHaveBeenCalledOnce();
  });

  it('reuses counters by name', () => {
    const add = vi.fn();
    const createCounter = vi.fn().mockReturnValue({ add });
    const telemetry = new OtelTelemetry('lab', { startActiveSpan: vi.fn() } as never, { createCounter } as never);

    telemetry.increment('lab.requests', 2, { route: '/health' });
    telemetry.increment('lab.requests');

    expect(createCounter).toHaveBeenCalledOnce();
    expect(add).toHaveBeenNthCalledWith(1, 2, { route: '/health' });
    expect(add).toHaveBeenNthCalledWith(2, 1, {});
  });

  it('rejects invalid counter increments', () => {
    const telemetry = new OtelTelemetry('lab', { startActiveSpan: vi.fn() } as never, { createCounter: vi.fn() } as never);

    expect(() => telemetry.increment('lab.requests', -1)).toThrow('finite and non-negative');
    expect(() => telemetry.increment('lab.requests', Number.NaN)).toThrow('finite and non-negative');
  });

  it('emits structured logs with severity and error attributes', () => {
    const emit = vi.fn();
    const telemetry = new OtelTelemetry(
      'lab',
      { startActiveSpan: vi.fn() } as never,
      { createCounter: vi.fn() } as never,
      { emit } as never,
    );
    const error = new Error('failed');

    telemetry.log('error', 'Operation failed', { operation: 'test' }, error);

    expect(emit).toHaveBeenCalledWith(expect.objectContaining({
      severityNumber: SeverityNumber.ERROR,
      severityText: 'ERROR',
      body: 'Operation failed',
      attributes: expect.objectContaining({ operation: 'test', 'error.type': 'Error', 'error.message': 'failed' }),
    }));
  });

  it('preserves non-Error failure context', () => {
    const emit = vi.fn();
    const telemetry = new OtelTelemetry(
      'lab',
      { startActiveSpan: vi.fn() } as never,
      { createCounter: vi.fn() } as never,
      { emit } as never,
    );

    telemetry.log('warn', 'Provider warning', {}, 'rate limited');

    expect(emit).toHaveBeenCalledWith(expect.objectContaining({
      attributes: expect.objectContaining({ 'error.type': 'string', 'error.message': 'rate limited' }),
    }));
  });
});
