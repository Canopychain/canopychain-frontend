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

export type PolygonGeometry =
  | { type: 'Polygon'; coordinates: number[][][] }
  | { type: 'MultiPolygon'; coordinates: number[][][][] };

export type Milestone = {
  id: string;
  index: number;
  thresholdBps: number;
  payoutBps: number;
  status: 'PENDING' | 'ATTESTED';
  attestedAt: string | null;
  payoutAmount: string | null;
};

export type ProjectProfile = Project & {
  recipientAddress: string | null;
  attestorAddress: string | null;
  polygonGeoJson: PolygonGeometry | null;
  polygonHash: string | null;
  milestones: Milestone[];
  stats: {
    donorCount: number;
    milestonesAttested: number;
    milestonesTotal: number;
  };
};

/** Returns null for a genuine 404 (distinct from a thrown network/server
 * error) so the caller can render "not found" instead of an error state. */
export async function getProject(id: string): Promise<ProjectProfile | null> {
  const res = await fetch(`${API_URL}/projects/${id}`, { next: { revalidate: 30 } });
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch project ${id}: ${res.status}`);
  }
  return res.json();
}
