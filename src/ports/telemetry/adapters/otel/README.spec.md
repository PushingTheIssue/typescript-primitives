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

The `@opentelemetry/api` and `@opentelemetry/api-logs` dependencies, a service name, and OpenTelemetry SDK, meter, tracer, and logs providers configured by the host application. No environment variables are required by this adapter.
