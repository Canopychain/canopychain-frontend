# Security Policy

This is the web app donors and operators use to sign real Stellar
transactions. A vulnerability here can cause someone to sign something
other than what they intended. If you find one, please report it privately
so it can be fixed before it's disclosed publicly.

## Scope

This policy covers the Next.js application in this repository.

Vulnerabilities in the Soroban contracts belong in
[canopychain-contracts](https://github.com/Canopychain/canopychain-contracts),
and API, indexer or attestation issues in
[canopychain-backend](https://github.com/Canopychain/canopychain-backend).
Report those against the relevant repository instead.

## Reporting a vulnerability

**Do not open a public GitHub issue for a security vulnerability.**

Instead, use GitHub's private vulnerability reporting:

1. Go to the [Security tab](https://github.com/Canopychain/canopychain-frontend/security) of this repository.
2. Click "Report a vulnerability" to open a private advisory.
3. Describe the issue, including steps to reproduce, the affected route or
   component, and the potential impact.

If you're unable to use GitHub's private reporting for any reason, contact
a maintainer directly rather than filing a public issue.

## What to expect

- We'll acknowledge new reports as soon as we can and work with you to
  understand and confirm the issue.
- We'll aim to keep you updated as a fix is developed and let you know
  before any public disclosure.
- Please give us a reasonable amount of time to address the issue before
  disclosing it publicly.

## What qualifies

Examples of in-scope issues:

- Anything that causes a user to sign a transaction whose effect differs
  from what the interface showed them, including a wrong recipient,
  attestor, token or amount.
- Cross-site scripting or injection reachable from project data, since much
  of what's rendered originates from operator-submitted content.
- Ways to point the app at an attacker-controlled contract id, RPC endpoint
  or backend without the user noticing.
- Leaking wallet material. The app should only ever hold a public address,
  never a secret key or seed phrase.
- Flaws in how a plot polygon is hashed or displayed that would let the
  polygon shown to a donor differ from the one committed on-chain.

Out of scope: vulnerabilities in wallet extensions themselves, which should
go to those projects, and the absence of a security header on a deployment
you control rather than on this codebase.
