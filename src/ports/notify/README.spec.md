---
type: Capability
title: Notify
description: Provider-neutral delivery of structured notifications through one facade.
tags: [infrastructure, notifications, port]
status: stable
---

# Does

`Notify.create({ adapter, ...options })` loads a supported notification adapter and exposes `notify({ title?, body?, actions })`. Actions are explicit `link` buttons with a label and URL or `callback` buttons with a label, ID, and optional value. Slack incoming webhooks render both button types, but callback handling requires a separately configured Slack interactivity endpoint.

# Requires

The selected adapter's construction options and provider endpoint. An optional `telemetry` implementation records notification spans, counts, and failures without recording notification content. The Slack adapter requires an incoming webhook URL.
