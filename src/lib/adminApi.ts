import type { WalletSignMessage } from '@/components/wallet/WalletProvider';

import type { Project } from './api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export type PendingProject = Project & {
  recipientAddress: string | null;
  attestorAddress: string | null;
  reviewNote: string | null;
};

/** Mirrors the backend's requireAdminSignature exactly: signs
 * `${method}:${path}:${timestamp}` and sends the pieces as headers. `path`
 * must match what Fastify sees as `request.url` — origin excluded, query
 * string included if present. */
async function adminFetch(
  method: string,
  path: string,
  address: string,
  signMessage: WalletSignMessage,
  body?: unknown,
): Promise<Response> {
  const timestamp = Date.now().toString();
  const payload = `${method}:${path}:${timestamp}`;
  const signature = await signMessage(payload);

  return fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      'x-admin-address': address,
      'x-admin-signature': signature,
      'x-admin-timestamp': timestamp,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function listPendingProjects(
  address: string,
  signMessage: WalletSignMessage,
): Promise<PendingProject[]> {
  const res = await adminFetch('GET', '/projects/pending', address, signMessage);
  if (!res.ok) {
    throw new Error(`Failed to fetch pending projects: ${res.status}`);
  }
  return res.json();
}

export async function rejectProject(
  address: string,
  signMessage: WalletSignMessage,
  id: string,
  reviewNote?: string,
): Promise<PendingProject> {
  const path = `/projects/${id}/reject`;
  const res = await adminFetch('POST', path, address, signMessage, { reviewNote });
  if (!res.ok) {
    throw new Error(`Failed to reject project: ${res.status}`);
  }
  return res.json();
}
