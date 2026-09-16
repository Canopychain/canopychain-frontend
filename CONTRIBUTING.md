# Contributing

This file covers the toolchain and checks for working in this repository.
For the full contribution guide (issue triage, PR process, coding
conventions across the Canopychain project), see
[canopychain-docs](https://canopychain.github.io/canopychain-docs/contributing).

## Toolchain

- Node.js 22 or newer, and npm.
- A Stellar wallet browser extension (Freighter, for example) if you want
  to exercise the signing flows by hand. The automated end-to-end tests
  deliberately avoid anything that needs one.

## Getting set up

```sh
cp .env.example .env
npm install
npm run dev
```

The dev server runs on port 3001. `ENVIRONMENT.md` documents every
variable; the contract ids and the backend API URL are the ones you'll
usually need to set.

## Checks to run before opening a PR

CI (`.github/workflows/ci.yml`) runs the following against every push and
pull request. Run them locally first so review isn't spent on things CI
would catch:

```sh
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install --with-deps chromium
npx playwright test e2e/donor-flow.spec.ts
```

`npm test` is the Vitest unit and component suite. Playwright drives the
`e2e/` specs instead, and Vitest is configured to skip that directory, so
the two never run each other's files.

## Repository layout

- `src/app`: App Router pages, including the donor, operator and admin
  routes.
- `src/components`: grouped by feature (`fund`, `operator`, `project`,
  `wallet`, `landing`, `layout`, `toast`).
- `src/lib`: the API client for reads, and the Soroban contract clients for
  writes.
- `e2e`: Playwright specs.

## Reads and writes take different paths

Reads come from the backend's indexed view of on-chain state. Writes go
straight from the browser to the Soroban contracts and are signed by the
user's wallet, never proxied through the backend. `README.md` explains the
split in more detail, and it's worth understanding before changing
anything in `src/lib`.

The contract clients in `src/lib` carry hand-written types mirroring the
contract signatures, because `Client.from` builds its methods at runtime
from the fetched spec and the compiler can't see them. If you change a
contract's interface, update those types to match.

## Security

Please don't open a public issue for a security vulnerability. See
[SECURITY.md](./SECURITY.md) for how to report one privately.
