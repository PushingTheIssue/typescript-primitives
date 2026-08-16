import type { Telemetry, TelemetryAttributes } from '../ports/telemetry/index.js';

export async function observe<T>(
  telemetry: Telemetry | undefined,
  port: string,
  adapter: string,
  operation: string,
  work: () => Promise<T>,
  attributes: TelemetryAttributes = {},
): Promise<T> {
  if (!telemetry) return work();

  const baseAttributes: TelemetryAttributes = { port, adapter, operation, ...attributes };
  let workStarted = false;
  let workCompleted = false;
  let workFailed = false;
  let workError: unknown;
  let workResult!: T;
  const observedWork = async (): Promise<T> => {
    workStarted = true;
    try {
      workResult = await work();
      workCompleted = true;
      safeIncrement(telemetry, baseAttributes, 'success');
      return workResult;
    } catch (error) {
      workFailed = true;
      workError = error;
      safeIncrement(telemetry, baseAttributes, 'error');
      safeLog(telemetry, port, operation, baseAttributes, error);
      throw error;
    }
  };

  try {
    return await telemetry.span(`pti.${port}.${operation}`, observedWork, baseAttributes);
  } catch (error) {
    // A broken exporter must not prevent the operation from running.
    if (workCompleted) return workResult;
    if (workFailed) throw workError;
    if (!workStarted) return observedWork();
    throw error;
  }
}

function safeIncrement(
  telemetry: Telemetry,
  attributes: TelemetryAttributes,
  status: 'success' | 'error',
): void {
  try {
    telemetry.increment('pti.operation.count', 1, { ...attributes, status });
  } catch {
    // Observability must remain best effort.
  }
}

function safeLog(
  telemetry: Telemetry,
  port: string,
  operation: string,
  attributes: TelemetryAttributes,
  error: unknown,
): void {
  try {
    const safeError = new Error('Operation failed');
    if (error instanceof Error) safeError.name = error.name;
    telemetry.log('error', `${port} ${operation} failed`, attributes, safeError);
  } catch {
    // Observability must remain best effort.
  }
}
