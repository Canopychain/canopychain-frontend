import { OperatorRegistrationForm } from '@/components/operator/OperatorRegistrationForm';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';

export default function RegisterProjectPage() {
  return (
    <>
      <Header />
      <main className="px-6 py-16 sm:px-12">
        <h1 className="text-2xl font-bold">Register a reforestation project</h1>
        <p className="mt-2 max-w-md text-sm text-gray-600">
          Registering opens the project&apos;s on-chain entry and submits its plot boundary for
          admin review. Donors can&apos;t fund it until an admin approves it.
        </p>
        <div className="mt-8">
          <OperatorRegistrationForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
