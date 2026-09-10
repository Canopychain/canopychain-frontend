const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

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

export type Donation = {
  id: string;
  amount: string;
  createdAt: string;
  project: Project;
};

/** Called client-side (it depends on the connected wallet address, which
 * only exists in the browser), so no Next.js server-fetch caching options. */
export async function getDonations(donor: string): Promise<Donation[]> {
  const res = await fetch(`${API_URL}/donations?donor=${encodeURIComponent(donor)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch donations: ${res.status}`);
  }
  return res.json();
}

export type ProjectRegistrationInput = {
  onChainId: string;
  recipientAddress: string;
  attestorAddress: string;
  polygonHash: string;
  polygonGeoJson: PolygonGeometry;
};

/** Attaches the off-chain project details (polygon, recipient, attestor)
 * to the on-chain project id an operator just got back from calling
 * project-registry's `register`. */
export async function registerProjectDetails(input: ProjectRegistrationInput): Promise<Project> {
  const res = await fetch(`${API_URL}/projects/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new ApiError('Failed to submit project details.', res.status);
  }
  return res.json();
}
