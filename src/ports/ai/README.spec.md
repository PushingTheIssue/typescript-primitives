---
type: Capability
title: AI Usage
description: Provider-neutral text completion through a selectable AI adapter.
tags: [infrastructure, ai, port]
status: stable
---

# Does

`Ai.create({ adapter, ...options })` loads an AI provider and exposes chat completion requests with normalized content and token usage.

# Requires

The selected adapter's provider credentials and construction options. An optional `telemetry` implementation records completion spans, operation counts, and failures without recording message content.
