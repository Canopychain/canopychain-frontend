# Route map

Every route under `src/app`, who it's for, and what it takes to use it.
"Wallet" means any Stellar wallet connected through the wallet-selector
modal (`src/components/wallet/WalletProvider.tsx`); "admin wallet" means
the wallet whose address matches the backend's `ADMIN_ADDRESS` — the
frontend has no separate admin login, the backend checks the signed
address on every admin request (see `src/lib/adminApi.ts`).

| Route | Audience | Wallet required? | Notes |
| --- | --- | --- | --- |
| `/` | Anonymous | No | Landing page. |
| `/projects` | Anonymous | No | Lists approved projects from the backend. Server-rendered; renders an empty/error state if the API is unreachable rather than crashing. |
| `/projects/[id]` | Anonymous | No | Project detail — stats, milestone timeline, plot map. Links to `/projects/[id]/fund` unless the project is cancelled. |
| `/projects/[id]/fund` | Donors | Yes, any wallet | Viewing the page needs no wallet; the deposit form itself (`FundProjectForm`) shows a "Connect Wallet" prompt in place of the form until one is connected, then signs the deposit transaction directly against the milestone-vault contract. |
| `/register` | Operators | Yes, any wallet | Same pattern as funding: the form (`OperatorRegistrationForm`) is unusable until a wallet is connected. Submitting signs an on-chain `register` call, then posts the plot boundary and addresses to the backend. Registered projects stay unfundable until an admin approves them. |
| `/dashboard` | Donors | Yes, any wallet | A connected wallet's own donation history, fetched from the backend by address. Shows a connect prompt instead of data until one is present. Not indexed (`robots: noindex`) since it's personal to whoever connects. |
| `/admin` | Admins | Yes, **admin wallet only** | Pending-project approval queue. The page itself doesn't block a non-admin wallet from loading — the backend's `x-admin-signature` check does, and every request 401s (surfaced as an error message) if the connected address isn't `ADMIN_ADDRESS`. Approving calls the on-chain registry directly; rejecting is backend-only. Not indexed. |
| `/admin/projects` | Admins | Yes, **admin wallet only** | Oversight view of every registered project regardless of status — rotate an attestor or cancel a project. Same admin-signature gate as `/admin`, enforced the same way (backend-checked, not page-checked). Not indexed (inherits the `/admin` segment's `robots` directive). |
| `/impact` | Anonymous | No | Platform-wide totals, polled every 20s. Aggregated client-side from the approved-projects list since the backend has no dedicated aggregate endpoint. |

## Wallet-gating pattern

There's no route guard or middleware that blocks access by wallet state —
every "gated" route renders fine without a wallet and shows a
"Connect Wallet" prompt in place of the parts that need one:

- **Donor/operator pages** (`/dashboard`, `/register`, `/projects/[id]/fund`)
  gate in the client component itself: no `address` from `useWallet()` →
  render the connect prompt instead of the form/data.
- **Admin pages** (`/admin`, `/admin/projects`) don't check *which* wallet
  is connected on the frontend at all — any connected wallet can load the
  page and attempt a request, but the backend's signature check
  (`requireAdminSignature`, mirrored by `adminFetch` in `src/lib/adminApi.ts`)
  rejects anything not signed by `ADMIN_ADDRESS`, and the UI surfaces that
  as a fetch error.
