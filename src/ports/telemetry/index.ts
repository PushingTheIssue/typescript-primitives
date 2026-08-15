export type TelemetryAttribute = string | number | boolean;
export type TelemetryAttributes = Readonly<Record<string, TelemetryAttribute>>;
export type TelemetryLogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface TelemetryOptions {
  readonly adapter: 'otel';
  readonly serviceName: string;
}

export abstract class Telemetry {
  constructor(public readonly adapter: string) {}

  static async create(options: TelemetryOptions): Promise<Telemetry> {
    if (options.adapter === 'otel') {
      const { OtelTelemetry } = await import('./adapters/otel/index.js');
      return new OtelTelemetry(options.serviceName);
    }

    throw new Error(`Unsupported telemetry adapter: ${(options as { adapter: string }).adapter}`);
  }

  abstract span<T>(
    name: string,
    work: () => Promise<T>,
    attributes?: TelemetryAttributes,
  ): Promise<T>;

  abstract increment(
    name: string,
    value?: number,
    attributes?: TelemetryAttributes,
  ): void;

  abstract log(
    level: TelemetryLogLevel,
    message: string,
    attributes?: TelemetryAttributes,
    error?: unknown,
  ): void;
}
