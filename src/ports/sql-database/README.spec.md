---
type: Capability
title: SQL Database
description: Provider-neutral SQL queries and database operations selected through one facade.
tags: [infrastructure, sql, port]
status: stable
---

# Does

`SqlDatabase.create({ adapter, ...options })` loads a supported SQL adapter and exposes parameterized queries. Adapters may provide interactive transactions or provider-specific operations such as D1 batches.

# Requires

The selected adapter's construction options and its provider dependency. Provider configuration belongs in that adapter's `.env.example` when environment variables are needed.
