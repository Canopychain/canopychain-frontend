import { notFound } from 'next/navigation';

import { FundProjectForm } from '@/components/fund/FundProjectForm';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { getProject } from '@/lib/api';

export default async function FundPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let projectName: string;
  try {
    const project = await getProject(id);
    if (!project) {
      notFound();
    }
    projectName = project.name;
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

  return (
    <>
      <Header />
      <main className="px-6 py-16 sm:px-12">
        <h1 className="text-2xl font-bold">Fund {projectName}</h1>
        <div className="mt-8">
          <FundProjectForm projectId={id} />
        </div>
      </main>
      <Footer />
    </>
  );
}
