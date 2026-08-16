import {
  metrics,
  SpanStatusCode,
  trace,
  type Counter,
  type Meter,
  type Tracer,
} from '@opentelemetry/api';
import { logs, SeverityNumber, type Logger } from '@opentelemetry/api-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { BatchLogRecordProcessor, LoggerProvider } from '@opentelemetry/sdk-logs';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { Telemetry, type TelemetryAttributes, type TelemetryLogLevel } from '../../index.js';

const DEFAULT_ENDPOINT = 'http://localhost:4318';

interface OtelOptions {
  readonly endpoint?: string;
  readonly headers?: Readonly<Record<string, string>>;
}

interface Providers {
  readonly tracerProvider: NodeTracerProvider;
  readonly meterProvider: MeterProvider;
  readonly loggerProvider: LoggerProvider;
}

export class OtelTelemetry extends Telemetry {
  private readonly counters = new Map<string, Counter>();
  private readonly providers?: Providers;
  private shutdownPromise?: Promise<void>;

  constructor(
    serviceName: string,
    private readonly tracer: Tracer = trace.getTracer(serviceName),
    private readonly meter: Meter = metrics.getMeter(serviceName),
    private readonly logger: Logger = logs.getLogger(serviceName),
    options?: OtelOptions,
  ) {
    super('otel');
    if (options !== undefined) {
      const configured = createProviders(serviceName, options);
      this.providers = configured;
      this.tracer = configured.tracerProvider.getTracer(serviceName);
      this.meter = configured.meterProvider.getMeter(serviceName);
      this.logger = configured.loggerProvider.getLogger(serviceName);
    }
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
        try {
          span.recordException(safeException(error));
          span.setStatus({ code: SpanStatusCode.ERROR });
        } catch {
          // Span reporting must not replace the operation error.
        }
        throw error;
      } finally {
        try {
          span.end();
        } catch {
          // Span reporting must not change the operation result.
        }
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

  async shutdown(): Promise<void> {
    if (!this.providers) return;
    this.shutdownPromise ??= Promise.all([
      this.providers.tracerProvider.shutdown(),
      this.providers.meterProvider.shutdown(),
      this.providers.loggerProvider.shutdown(),
    ]).then(() => undefined);
    await this.shutdownPromise;
  }
}

function createProviders(serviceName: string, options: OtelOptions): Providers {
  const configuredEndpoint = options.endpoint?.trim() || process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim() || DEFAULT_ENDPOINT;
  const endpoint = new URL(configuredEndpoint);
  const headers = mergeHeaders(parseHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS), options.headers);
  const resource = resourceFromAttributes({ 'service.name': serviceName });
  const tracerProvider = new NodeTracerProvider({
    resource,
    spanProcessors: [new BatchSpanProcessor(new OTLPTraceExporter({ url: signalEndpoint(endpoint, 'traces'), headers }))],
  });
  const meterProvider = new MeterProvider({
    resource,
    readers: [new PeriodicExportingMetricReader({ exporter: new OTLPMetricExporter({ url: signalEndpoint(endpoint, 'metrics'), headers }) })],
  });
  const loggerProvider = new LoggerProvider({
    resource,
    processors: [new BatchLogRecordProcessor({ exporter: new OTLPLogExporter({ url: signalEndpoint(endpoint, 'logs'), headers }) })],
  });
  return { tracerProvider, meterProvider, loggerProvider };
}

function signalEndpoint(endpoint: URL, signal: 'traces' | 'metrics' | 'logs'): string {
  const result = new URL(endpoint);
  result.pathname = result.pathname.replace(/\/v1\/(?:traces|metrics|logs)\/?$/, '').replace(/\/$/, '') + `/v1/${signal}`;
  return result.toString();
}

function parseHeaders(value: string | undefined): Record<string, string> {
  if (!value) return {};
  return Object.fromEntries(value.split(',').flatMap((entry) => {
    const separator = entry.indexOf('=');
    if (separator < 0) return [];
    const key = entry.slice(0, separator).trim();
    const value = entry.slice(separator + 1).trim();
    try {
      return key ? [[key, decodeURIComponent(value)]] : [];
    } catch {
      return key ? [[key, value]] : [];
    }
  }));
}

function mergeHeaders(
  environmentHeaders: Readonly<Record<string, string>>,
  explicitHeaders: Readonly<Record<string, string>> | undefined,
): Record<string, string> {
  const merged: Record<string, string> = {};
  for (const [key, value] of Object.entries(environmentHeaders)) merged[key.toLowerCase()] = value;
  for (const [key, value] of Object.entries(explicitHeaders ?? {})) merged[key.toLowerCase()] = value;
  return merged;
}

function safeException(error: unknown): Error {
  const exception = new Error('Operation failed');
  if (error instanceof Error) exception.name = error.name;
  return exception;
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
