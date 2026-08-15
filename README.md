---
type: Package
title: TypeScript Primitives
description: Reusable hexagonal infrastructure capabilities for TypeScript labs.
tags: [typescript, hexagonal-architecture, infrastructure]
status: stable
---

# TypeScript Primitives

Reusable infrastructure capabilities for labs in `pti_homepage`. This repository contains ports and adapters only; labs own domain models, application services, repositories, and migrations.

## Capabilities

- `src/ports/sql-database`: SQL facade with PostgreSQL, SQLite, and Cloudflare D1 adapters.
- `src/ports/blob-storage`: Blob facade with S3 and in-memory adapters.
- `src/ports/ai`: AI completion facade with an OpenRouter adapter.
- `src/ports/telemetry`: telemetry facade with an OpenTelemetry adapter.

Each capability has a concise OKF specification at `README.spec.md`. Read adapter specifications beside their implementations for behavior and requirements; they are not change logs.

## Usage

```ts
import { SqlDatabase } from '@pushingtheissue/typescript-primitives';

const database = await SqlDatabase.create({
  adapter: 'sqlite',
  filename: './lab.db',
});
```

Factories load the selected adapter. One `npm install` installs all supported adapter dependencies.

## Development

```sh
npm install
npm test
npm run typecheck
npm run lint
npm run build
```

Adapter environment examples exist only where labs need provider configuration. Factories receive the mapped values as options; they do not load `.env` files themselves:

- `src/ports/sql-database/adapters/postgres/.env.example`
- `src/ports/blob-storage/adapters/s3/.env.example`
- `src/ports/ai/adapters/openrouter/.env.example`

Never commit populated `.env` files or credentials.

## Releases

Commits pushed to `main` are versioned by Release Please using conventional commit prefixes such as `feat:`, `fix:`, and `BREAKING CHANGE:`. Release Please opens a release pull request; merging it creates the GitHub release and tag, then the tag-triggered workflow verifies and publishes the package to npm.

Configure the repository `NPM_TOKEN` secret with permission to publish `@pushingtheissue/typescript-primitives` before merging the first release pull request.
