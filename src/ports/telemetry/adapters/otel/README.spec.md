---
type: Adapter
title: OpenTelemetry Adapter
description: Records spans, counters, and structured logs through the OpenTelemetry APIs.
tags: [infrastructure, telemetry, opentelemetry, adapter]
status: stable
---

# Does

Implements `Telemetry` with active spans, exception status, span cleanup, cached counters, and severity-mapped logs. Counter names should be bounded, stable metric names rather than request-derived values.

# Requires

The `@opentelemetry/api` and `@opentelemetry/api-logs` dependencies and a service name. The adapter owns its OTLP HTTP exporters and provider registration; host SDK setup is not required.

# Setup

Create the adapter directly:

```ts
const telemetry = await Telemetry.create({
  adapter: 'otel',
  serviceName: 'my-lab',
  endpoint: 'https://otel-collector.example.com',
  headers: { Authorization: 'Bearer TOKEN' },
});
```

`endpoint` defaults to `OTEL_EXPORTER_OTLP_ENDPOINT`, then `http://localhost:4318`. The adapter appends `/v1/traces`, `/v1/metrics`, and `/v1/logs`. See `.env.example` for the adapter's supported environment variables.

```sh
OTEL_EXPORTER_OTLP_ENDPOINT=https://otel-collector.example.com
OTEL_EXPORTER_OTLP_HEADERS=Authorization=Bearer%20TOKEN
```

Environment headers are merged first; explicit `headers` override duplicate keys. `endpoint` may be an OTLP base URL or a signal URL such as `/v1/traces`; the adapter normalizes it before appending each signal path. Call `await telemetry.shutdown()` during application shutdown. Providers are instance-owned and are not registered globally, so host applications may configure separate OpenTelemetry providers independently.
