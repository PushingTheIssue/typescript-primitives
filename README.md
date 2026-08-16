# TypeScript Primitives

Reusable hexagonal infrastructure capabilities for TypeScript projects. This package contains ports and adapters only; consuming projects own domain models, application services, repositories, and migrations.

## Capabilities

- `src/ports/sql-database`: SQL facade with PostgreSQL, SQLite, and Cloudflare D1 adapters.
- `src/ports/blob-storage`: Blob facade with S3 and in-memory adapters.
- `src/ports/ai`: AI completion facade with an OpenRouter adapter.
- `src/ports/telemetry`: Telemetry facade with an OpenTelemetry adapter.
- `src/ports/notify`: Notification facade with a Slack incoming webhook adapter.

Each capability has a `README.spec.md` beside its facade and each adapter. Those files describe the capability's behavior and requirements.

## Usage

```ts
import { SqlDatabase } from '@pushingtheissue/typescript-primitives';

const database = await SqlDatabase.create({
  adapter: 'sqlite',
  filename: './lab.db',
});
```

Factories load the selected adapter. One `npm install` installs all supported adapter dependencies so it doesn't need to be repeatedly handled.

## Development

```sh
npm install
npm test
npm run typecheck
npm run lint
npm run build
```

Adapter environment examples exist only where provider configuration is needed. Factories receive mapped values as options and do not load `.env` files themselves:

- `src/ports/sql-database/adapters/postgres/.env.example`
- `src/ports/blob-storage/adapters/s3/.env.example`
- `src/ports/ai/adapters/openrouter/.env.example`

Never commit populated `.env` files or credentials.
