import { Client } from '@stellar/stellar-sdk/contract';
import type { AssembledTransaction } from '@stellar/stellar-sdk/contract';

import type { WalletSignTransaction } from '@/components/wallet/WalletProvider';

import { MILESTONE_VAULT_CONTRACT_ID, NETWORK_PASSPHRASE, SOROBAN_RPC_URL } from './stellar';

/**
 * Client.from builds its methods at runtime from the spec it fetches, so the
 * compiler can't see them. This is the slice of milestone-vault's interface
 * the app actually calls, mirroring the signatures in the contract's lib.rs.
 * Regenerate properly with `stellar contract bindings typescript` if this
 * grows much past a handful of methods.
 */
export type MilestoneVaultClient = Client & {
  deposit(args: {
    donor: string;
    project_id: bigint;
    recipient: string;
    attestor: string;
    token: string;
    amount: bigint;
  }): Promise<AssembledTransaction<bigint>>;
  set_attestor(args: {
    project_id: bigint;
    new_attestor: string;
  }): Promise<AssembledTransaction<null>>;
  cancel_project(args: { project_id: bigint }): Promise<AssembledTransaction<null>>;
  refund(args: { project_id: bigint; donor: string }): Promise<AssembledTransaction<bigint>>;
};

/**
 * A fresh Client per call rather than a cached singleton: Client.from is
 * async (it fetches the contract's spec from the network) and cheap
 * enough not to bother caching yet — worth revisiting if this turns out
 * to be a real cost once this is actually running against a network.
 */
export async function getMilestoneVaultClient(
  publicKey: string,
  signTransaction: WalletSignTransaction,
): Promise<MilestoneVaultClient> {
  if (!MILESTONE_VAULT_CONTRACT_ID) {
    throw new Error('NEXT_PUBLIC_MILESTONE_VAULT_CONTRACT_ID is not set');
  }

  const client = await Client.from({
    contractId: MILESTONE_VAULT_CONTRACT_ID,
    networkPassphrase: NETWORK_PASSPHRASE,
    rpcUrl: SOROBAN_RPC_URL,
    publicKey,
    signTransaction,
  });

  return client as MilestoneVaultClient;
}
