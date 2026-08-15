import {
  metrics,
  SpanStatusCode,
  trace,
  type Counter,
  type Meter,
  type Tracer,
} from '@opentelemetry/api';
import { logs, SeverityNumber, type Logger } from '@opentelemetry/api-logs';
import { Telemetry, type TelemetryAttributes, type TelemetryLogLevel } from '../../index.js';

export class OtelTelemetry extends Telemetry {
  private readonly counters = new Map<string, Counter>();

  constructor(
    serviceName: string,
    private readonly tracer: Tracer = trace.getTracer(serviceName),
    private readonly meter: Meter = metrics.getMeter(serviceName),
    private readonly logger: Logger = logs.getLogger(serviceName),
  ) {
    super('otel');
  }

  async span<T>(
    name: string,
    work: () => Promise<T>,
    attributes: TelemetryAttributes = {},
  ): Promise<T> {
    return this.tracer.startActiveSpan(name, { attributes }, async (span) => {
      try {
        return await work();
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  increment(name: string, value = 1, attributes: TelemetryAttributes = {}): void {
    if (!Number.isFinite(value) || value < 0) {
      throw new RangeError('OpenTelemetry counter increments must be finite and non-negative');
    }

    let counter = this.counters.get(name);
    if (!counter) {
      counter = this.meter.createCounter(name);
      this.counters.set(name, counter);
    }
    counter.add(value, attributes);
  }

  log(level: TelemetryLogLevel, message: string, attributes: TelemetryAttributes = {}, error?: unknown): void {
    const errorAttributes = toErrorAttributes(error);
    this.logger.emit({
      severityNumber: severityNumber(level),
      severityText: level.toUpperCase(),
      body: message,
      attributes: { ...attributes, ...errorAttributes },
    });
  }
}

function toErrorAttributes(error: unknown): TelemetryAttributes {
  if (error === undefined) return {};
  if (error instanceof Error) {
    return {
      'error.type': error.name,
      'error.message': error.message,
      ...(error.stack ? { 'error.stack': error.stack } : {}),
    };
  }

  const message = typeof error === 'string' ? error : stringifyError(error);
  return {
    'error.type': typeof error,
    'error.message': message ?? String(error),
  };
}

function stringifyError(error: unknown): string {
  try {
    return JSON.stringify(error) ?? String(error);
  } catch {
    return String(error);
  }
}

function severityNumber(level: TelemetryLogLevel): SeverityNumber {
  switch (level) {
    case 'trace': return SeverityNumber.TRACE;
    case 'debug': return SeverityNumber.DEBUG;
    case 'info': return SeverityNumber.INFO;
    case 'warn': return SeverityNumber.WARN;
    case 'error': return SeverityNumber.ERROR;
    case 'fatal': return SeverityNumber.FATAL;
  }
}
