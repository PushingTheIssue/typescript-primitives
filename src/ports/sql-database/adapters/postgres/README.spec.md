---
type: Adapter
title: PostgreSQL SQL Adapter
description: Executes SQL queries and interactive transactions through a PostgreSQL pool.
tags: [infrastructure, sql, postgres, adapter]
status: stable
---

# Does

Implements `SqlDatabase` with `pg`, including parameterized queries, commit, rollback, and client release.

# Requires

The `pg` dependency and a PostgreSQL connection string passed as `connectionString` to the facade. The `.env.example` provides the conventional lab variable to map into that option.
