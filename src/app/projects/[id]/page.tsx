import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PolygonMap } from '@/components/project/PolygonMap';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { getProject, type ProjectProfile } from '@/lib/api';

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let project: ProjectProfile | null;
  try {
    project = await getProject(id);
  } catch {
    return (
      <>
        <Header />
        <main className="px-6 py-16 sm:px-12">
          <p className="text-red-600">
            Couldn&apos;t reach the Canopychain API. Is the backend running?
          </p>
        </main>
        <Footer />
      </>
    );
  }

  if (!project) {
    notFound();
  }

  return (
    <>
      <Header />
      <main className="px-6 py-16 sm:px-12">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{project.name}</h1>
          {project.approved && (
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
              Approved
            </span>
          )}
          {project.cancelled && (
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
              Cancelled
            </span>
          )}
        </div>

        {project.polygonGeoJson && (
          <div className="mt-8">
            <PolygonMap geometry={project.polygonGeoJson} />
          </div>
        )}

        <dl className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
          <div>
            <dt className="text-sm text-gray-500">Total deposited</dt>
            <dd className="text-lg font-semibold">{project.totalDeposited}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Total released</dt>
            <dd className="text-lg font-semibold">{project.totalReleased}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Milestones attested</dt>
            <dd className="text-lg font-semibold">
              {project.stats.milestonesAttested} / {project.stats.milestonesTotal}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Donors</dt>
            <dd className="text-lg font-semibold">{project.stats.donorCount}</dd>
          </div>
        </dl>

        {!project.cancelled && (
          <Link
            href={`/projects/${project.id}/fund`}
            className="mt-10 inline-block rounded-md bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-800"
          >
            Fund this project
          </Link>
        )}
      </main>
      <Footer />
    </>
  );
}
