# Repository Guidance

## Scope

This repository contains reusable TypeScript infrastructure packages for labs. Do not add lab-specific domain models, application services, repositories, or migrations.

## Capability Layout

Each capability is a package with one facade and colocated adapters:

```text
packages/<capability>/
  package.json
  src/index.ts
  src/adapters/<adapter>/index.ts
  src/adapters/<adapter>/tests/
  src/tests/
```

Until workspaces are split, use the equivalent layout under `src/ports/<capability>`. The facade is an abstract class with `create({ adapter, ...options })`; it dynamically loads the selected adapter. Adapters extend the facade's port class and set its public `adapter` attribute. Keep provider SDK imports inside adapter directories.

Every port and adapter directory has a concise `README.spec.md` in Open Knowledge Format (OKF v0.2). It must start with YAML frontmatter containing at least `type`, and its body must state what the capability does and what it requires. Keep specs current and do not use them as change logs.

Put `<adapter>/.env.example` beside an adapter only when it requires environment variables. Include only that adapter's variables. Never commit populated `.env` files or credentials.

## TDD

Use RED/GREEN TDD for every change:

1. Add or update the test first.
2. Add the smallest compiling stub needed for the test import to resolve.
3. Confirm RED fails because behavior is missing, not because an import is broken.
4. Implement the smallest GREEN change.
5. Refactor only after the test passes.

Port/facade tests belong in `src/tests`; provider behavior tests belong in the adapter's `tests` directory.

## Verification

```sh
npm test
npm run typecheck
npm run lint
npm run build
```
