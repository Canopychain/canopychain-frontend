import type { Metadata } from 'next';
import Link from 'next/link';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { getProjects, type Project } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Explore Projects',
  description:
    'Browse GPS-bounded reforestation projects funded through milestone-verified escrow on Stellar.',
};

export default async function ProjectsPage() {
  let projects: Project[] = [];
  let loadError = false;

  try {
    projects = await getProjects();
  } catch {
    loadError = true;
  }

  return (
    <>
      <Header />
      <main className="px-6 py-16 sm:px-12">
        <h1 className="text-2xl font-bold">Explore Projects</h1>

        {loadError && (
          <p className="mt-4 text-red-600">
            Couldn&apos;t reach the Canopychain API. Is the backend running?
          </p>
        )}

        {!loadError && projects.length === 0 && (
          <p className="mt-4 text-gray-600">No approved projects yet.</p>
        )}

        {!loadError && projects.length > 0 && (
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <li key={project.id} className="rounded-lg border border-gray-200 p-6">
                <h2 className="font-semibold">{project.name}</h2>
                <Link
                  href={`/projects/${project.id}`}
                  className="mt-4 inline-block text-sm font-medium text-black underline"
                >
                  View project
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </>
  );
}
