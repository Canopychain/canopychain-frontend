const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export type Project = {
  id: string;
  onChainId: string;
  operatorAddress: string;
  name: string;
  approved: boolean;
  cancelled: boolean;
  totalDeposited: string;
  totalReleased: string;
  createdAt: string;
  updatedAt: string;
};

export async function getProjects(): Promise<Project[]> {
  const res = await fetch(`${API_URL}/projects`, { next: { revalidate: 30 } });
  if (!res.ok) {
    throw new Error(`Failed to fetch projects: ${res.status}`);
  }
  return res.json();
}
