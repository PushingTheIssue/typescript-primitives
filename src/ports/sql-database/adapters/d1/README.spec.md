---
type: Adapter
title: Cloudflare D1 SQL Adapter
description: Executes parameterized SQL and atomic batches through a Cloudflare D1 binding.
tags: [infrastructure, sql, cloudflare, d1, adapter]
status: stable
---

# Does

Implements `SqlDatabase` with a Cloudflare D1 binding. It provides queries and `batch()` operations; interactive transactions are rejected because D1 exposes atomic batches instead.

# Requires

A Cloudflare D1 binding supplied to the facade factory. No environment variables are required by the adapter.
