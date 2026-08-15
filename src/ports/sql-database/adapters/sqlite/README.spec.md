---
type: Adapter
title: SQLite SQL Adapter
description: Executes SQL queries and serialized interactive transactions through better-sqlite3.
tags: [infrastructure, sql, sqlite, adapter]
status: stable
---

# Does

Implements `SqlDatabase` with an opened `better-sqlite3` database. It supports parameterized queries, commit, rollback, and nested-transaction rejection.

# Requires

The `better-sqlite3` dependency and a database filename supplied to the facade factory. No environment variables are required.
