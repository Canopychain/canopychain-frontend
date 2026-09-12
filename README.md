# Canopychain — Frontend

Donor and operator web app for Canopychain, a milestone-verified
reforestation funding platform on Stellar.

## Stack

- Next.js (App Router), React, TypeScript
- Tailwind CSS

## Local development

```
cp .env.example .env
npm install
npm run dev   # http://localhost:3001 — 3000 is taken by canopychain-backend
```

## Deployment

**Vercel (recommended)** — Next.js's own platform, effectively zero-config:
connect the repo, set the `NEXT_PUBLIC_*` env vars from `.env.example` in
the project settings, deploy. No Dockerfile involved.

**Docker (self-hosting)**:

```
docker build -t canopychain-frontend .
docker run -p 3001:3001 --env-file .env canopychain-frontend
```

The image uses Next's `standalone` output — a minimal self-contained
server, not the full `node_modules` — and runs as a non-root user. Note
that `NEXT_PUBLIC_*` vars are baked in at **build time**, not read at
container startup — rebuild the image after changing any of them, an
`--env-file` at `docker run` alone won't pick up new values.

Every route also gets `X-Frame-Options: DENY`, `X-Content-Type-Options:
nosniff`, and a strict `Referrer-Policy` (see `src/middleware.ts`) —
there's no route here meant to be embedded elsewhere.

## Docs

- [ROUTES.md](./ROUTES.md) — every route, its audience, and whether it's wallet-gated
- [ENVIRONMENT.md](./ENVIRONMENT.md) — every `NEXT_PUBLIC_*` variable, what breaks without it, and where its value comes from

## Related repositories

- [canopychain-contracts](https://github.com/canopychain/canopychain-contracts) — Soroban smart contracts
- [canopychain-backend](https://github.com/canopychain/canopychain-backend) — indexer & API
- [canopychain-docs](https://github.com/canopychain/canopychain-docs) — documentation

## Status

Early development.

## License

Apache-2.0 — see [LICENSE](./LICENSE).
