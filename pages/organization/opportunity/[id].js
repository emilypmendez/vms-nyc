import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../components/shared/ProtectedRoute';
import OpportunityDetail from '../../../components/organization/OpportunityDetail';
import ApplicationList from '../../../components/organization/ApplicationList';

export default function EditOpportunityPage() {
  const router = useRouter();
  // router.query is empty on the first render; wait until it's ready.
  const id = router.isReady ? router.query.id : null;

  return (
    <ProtectedRoute requiredRole="organization">
      <Head>
        <title>Edit Opportunity</title>
      </Head>
      <main className="max-w-3xl mx-auto p-6 space-y-6">
        <Link href="/organization/dashboard" className="text-blue-600 text-sm hover:underline">
          &larr; Back to dashboard
        </Link>

        {id && <OpportunityDetail id={id} />}

        {id && <ApplicationList opportunityId={id} />}
      </main>
    </ProtectedRoute>
  );
}
