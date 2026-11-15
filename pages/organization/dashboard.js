import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import ProtectedRoute from '../../components/shared/ProtectedRoute';
import OpportunityList from '../../components/organization/OpportunityList';
import { fetchApi } from '../../lib/fetchApi';

function OrganizationHeader() {
  const [org, setOrg] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApi('/api/organization/profile')
      .then((result) => setOrg(result.data))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="text-red-600">{error}</div>;
  if (!org) return <div className="h-16" />;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{org.name}</h1>
        {org.verified ? (
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Verified</span>
        ) : (
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
            Pending verification
          </span>
        )}
      </div>
      {org.description && <p className="text-gray-600 mt-1">{org.description}</p>}
    </div>
  );
}

export default function OrganizationDashboardPage() {
  return (
    <ProtectedRoute requiredRole="organization">
      <Head>
        <title>Organization Dashboard</title>
      </Head>
      <main className="max-w-5xl mx-auto p-6 space-y-8">
        <OrganizationHeader />

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Your Opportunities</h2>
            <Link
              href="/organization/opportunity/new"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + Create New Opportunity
            </Link>
          </div>
          <OpportunityList />
        </section>
      </main>
    </ProtectedRoute>
  );
}
