import Head from 'next/head';
import Link from 'next/link';
import ProtectedRoute from '../../components/shared/ProtectedRoute';
import ProfileForm from '../../components/volunteer/ProfileForm';

export default function VolunteerProfilePage() {
  return (
    <ProtectedRoute requiredRole="volunteer">
      <Head>
        <title>Edit Profile</title>
      </Head>
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8">
          <Link
            href="/volunteer/dashboard"
            className="inline-flex items-center text-sm font-medium text-blue-600 hover:underline"
          >
            ← Back to dashboard
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit profile</h1>
            <p className="text-sm text-gray-600">
              Organizations use this to match you with opportunities.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <ProfileForm />
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
