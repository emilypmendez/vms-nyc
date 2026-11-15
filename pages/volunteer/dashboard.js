import Head from 'next/head';
import ProtectedRoute from '../../components/shared/ProtectedRoute';
import VolunteerDashboard from '../../components/volunteer/VolunteerDashboard';

export default function VolunteerDashboardPage() {
  return (
    <ProtectedRoute requiredRole="volunteer">
      <Head>
        <title>Volunteer Dashboard</title>
      </Head>
      <main className="min-h-screen bg-gray-50">
        <VolunteerDashboard />
      </main>
    </ProtectedRoute>
  );
}
