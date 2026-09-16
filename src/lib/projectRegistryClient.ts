import { Client } from '@stellar/stellar-sdk/contract';
import type { AssembledTransaction } from '@stellar/stellar-sdk/contract';

import type { WalletSignTransaction } from '@/components/wallet/WalletProvider';

import { NETWORK_PASSPHRASE, PROJECT_REGISTRY_CONTRACT_ID, SOROBAN_RPC_URL } from './stellar';

/**
 * Client.from builds its methods at runtime from the spec it fetches, so the
 * compiler can't see them. This is the slice of project-registry's interface
 * the app actually calls, mirroring the signatures in the contract's lib.rs.
 * Regenerate properly with `stellar contract bindings typescript` if this
 * grows much past a handful of methods.
 */
export type ProjectRegistryClient = Client & {
  register(args: {
    operator: string;
    recipient: string;
    attestor: string;
    polygon_hash: Uint8Array;
    name: string;
  }): Promise<AssembledTransaction<bigint>>;
  approve_project(args: { project_id: bigint }): Promise<AssembledTransaction<null>>;
};

/**
 * A fresh Client per call rather than a cached singleton: Client.from is
 * async (it fetches the contract's spec from the network) and cheap
 * enough not to bother caching yet — worth revisiting if this turns out
 * to be a real cost once this is actually running against a network.
 */
export async function getProjectRegistryClient(
  publicKey: string,
  signTransaction: WalletSignTransaction,
): Promise<ProjectRegistryClient> {
  if (!PROJECT_REGISTRY_CONTRACT_ID) {
    throw new Error('NEXT_PUBLIC_PROJECT_REGISTRY_CONTRACT_ID is not set');
  }

  const client = await Client.from({
    contractId: PROJECT_REGISTRY_CONTRACT_ID,
    networkPassphrase: NETWORK_PASSPHRASE,
    rpcUrl: SOROBAN_RPC_URL,
    publicKey,
    signTransaction,
  });

  return client as ProjectRegistryClient;
}
