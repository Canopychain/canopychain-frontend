import { notFound } from 'next/navigation';

import { FundProjectForm } from '@/components/fund/FundProjectForm';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { getProject, type ProjectProfile } from '@/lib/api';

export default async function FundPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let project: ProjectProfile;
  try {
    const found = await getProject(id);
    if (!found) {
      notFound();
    }
    project = found;
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
        <h1 className="text-2xl font-bold">Fund {project.name}</h1>
        <div className="mt-8">
          {project.recipientAddress && project.attestorAddress ? (
            <FundProjectForm
              projectOnChainId={project.onChainId}
              recipientAddress={project.recipientAddress}
              attestorAddress={project.attestorAddress}
            />
          ) : (
            <p className="text-gray-600">
              This project hasn&apos;t finished registration yet and can&apos;t accept funds.
            </p>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
