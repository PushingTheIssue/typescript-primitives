---
type: Adapter
title: Slack Notify Adapter
description: Sends structured notifications to Slack through an incoming webhook.
tags: [infrastructure, notifications, slack, adapter]
status: stable
---

# Does

Maps notification titles, bodies, and actions to Slack Block Kit header, section, and button blocks. A link action maps to `url`; a callback action maps its ID and optional value to `action_id` and `value`. Top-level `text` uses `title ?? body ?? 'Notification'`, and unsuccessful responses are rejected. Incoming webhooks render callback buttons but callback handling requires a separately configured Slack interactivity endpoint.

# Requires

A Slack incoming webhook URL supplied through `Notify.create` options.
