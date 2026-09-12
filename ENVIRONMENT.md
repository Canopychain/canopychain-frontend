# Environment variables

All five variables are `NEXT_PUBLIC_*`, which means Next.js inlines their
values into the JS bundle **at build time** — they are not read from the
environment at runtime. Changing one requires a rebuild (`npm run build`
locally, or a new Docker image); restarting a running container with a
different `--env-file` has no effect. See the README's Docker section for
the same caveat from the deployment side.

| Variable | Required? | What breaks without it | Where the value comes from |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | No — defaults to `http://localhost:3000` | Every request to the backend (`src/lib/api.ts`, `src/lib/adminApi.ts`) goes to the wrong host. Fine for local dev against `canopychain-backend` on its default port; must be set to the real API origin for any other deployment. | The URL your `canopychain-backend` instance is reachable at. |
| `NEXT_PUBLIC_SOROBAN_RPC_URL` | No — defaults to `https://soroban-testnet.stellar.org` | Contract calls (funding, registering, admin actions) go to the wrong network's RPC. The default is testnet; set this explicitly for mainnet. | A Soroban RPC endpoint for the network you're targeting — testnet default shown, or a mainnet RPC provider for production. |
| `NEXT_PUBLIC_NETWORK_PASSPHRASE` | No — defaults to `Test SDF Network ; September 2015` (testnet) | Transactions get signed for the wrong network and are rejected by the RPC endpoint above if it's on a different one. Must match `NEXT_PUBLIC_SOROBAN_RPC_URL`'s network exactly. | Fixed per network — Stellar publishes the passphrase for each (testnet, mainnet, futurenet). |
| `NEXT_PUBLIC_MILESTONE_VAULT_CONTRACT_ID` | **Yes**, for any donor/operator action beyond browsing | Empty by default. Funding a project, registering a project, and every admin action against the vault (rotate attestor, cancel project) throw `NEXT_PUBLIC_MILESTONE_VAULT_CONTRACT_ID is not set` (`src/lib/milestoneVaultClient.ts`) the moment they're attempted. Browsing `/`, `/projects`, `/impact` still works. | `canopychain-contracts/deployments.json`, after that contract is deployed to the network you're targeting. |
| `NEXT_PUBLIC_PROJECT_REGISTRY_CONTRACT_ID` | **Yes**, for registering or approving projects | Empty by default. Registering a project (`/register`) and approving one (`/admin`) throw `NEXT_PUBLIC_PROJECT_REGISTRY_CONTRACT_ID is not set` (`src/lib/projectRegistryClient.ts`) the moment they're attempted. | Same file, `canopychain-contracts/deployments.json`. |

## Setting these up locally

```
cp .env.example .env
```

The three network variables (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOROBAN_RPC_URL`,
`NEXT_PUBLIC_NETWORK_PASSPHRASE`) already default to a working local/testnet
setup, so leave them blank unless you're pointing at something non-default
(a deployed backend, mainnet, etc.). The two contract ID variables have no
default — fill them in from `canopychain-contracts/deployments.json` once
you've deployed both contracts, or funding/registering/admin actions will
fail with the "not set" errors described above (read-only pages work fine
without them).
