---
type: Capability
title: Telemetry
description: Provider-neutral traces, counters, and structured logs selected through one facade.
tags: [infrastructure, telemetry, observability, port]
status: stable
---

# Does

`Telemetry.create({ adapter, ...options })` loads an observability provider and exposes async spans, counter increments, and structured logs with normalized attributes. Logs accept `trace`, `debug`, `info`, `warn`, `error`, and `fatal`; an optional error is emitted as `error.type`, `error.message`, and, for `Error` values, `error.stack`.

# Requires

The selected adapter's service name and provider options. The OpenTelemetry adapter can configure OTLP HTTP exporters directly with an endpoint and headers.
