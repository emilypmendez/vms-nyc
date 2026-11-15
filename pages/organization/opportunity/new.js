import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../components/shared/ProtectedRoute';
import OpportunityForm from '../../../components/organization/OpportunityForm';
import { fetchApi } from '../../../lib/fetchApi';

export default function NewOpportunityPage() {
  const router = useRouter();

  const handleCreate = async (payload) => {
    await fetchApi('/api/organization/opportunities', { method: 'POST', body: payload });
    router.push('/organization/dashboard');
  };

  return (
    <ProtectedRoute requiredRole="organization">
      <Head>
        <title>New Opportunity</title>
      </Head>
      <main className="max-w-3xl mx-auto p-6 space-y-6">
        <Link href="/organization/dashboard" className="text-blue-600 text-sm hover:underline">
          &larr; Back to dashboard
        </Link>
        <h1 className="text-2xl font-bold">Create New Opportunity</h1>
        <OpportunityForm onSubmit={handleCreate} submitLabel="Create Opportunity" />
      </main>
    </ProtectedRoute>
  );
}
