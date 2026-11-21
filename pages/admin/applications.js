
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import ProtectedRoute from '../../components/shared/ProtectedRoute';
import { fetchApi } from '../../lib/fetchApi';
import { BOROUGHS, boroughLabel } from '../../lib/volunteerOptions';

const STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

function ApplicationsContent() {
  const [applications, setApplications] = useState([]);
  const [status, setStatus] = useState('');
  const [borough, setBorough] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const limit = 20;

  useEffect(() => {
    let active = true;

    async function loadApplications() {
      setLoading(true);
      setError('');

      try {
        const params = new URLSearchParams({
          limit: String(limit),
          offset: String(page * limit),
        });

        if (status) params.set('status', status);
        if (borough) params.set('borough', borough);

        const result = await fetchApi(
          `/api/admin/applications?${params.toString()}`
        );

        if (active) {
          setApplications(result.data || []);
          setTotal(result.total || 0);
        }
      } catch (err) {
        if (active) {
          setError(err.message);
          setApplications([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadApplications();

    return () => {
      active = false;
    };
  }, [status, borough, page]);

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <Head>
        <title>Applications · Admin</title>
      </Head>

      <Link href="/admin/dashboard" className="mb-3 inline-block text-blue-600 text-sm hover:underline">
        &larr; Back to admin dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-2">
        Application Tracking
      </h1>

      <p className="text-gray-600 mb-6">
        Monitor volunteer applications across the platform.
      </p>

      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block mb-2 font-medium">
            Filter by status
          </label>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
            className="border rounded-lg p-3 bg-white"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Filter by borough
          </label>

          <select
            value={borough}
            onChange={(e) => {
              setBorough(e.target.value);
              setPage(0);
            }}
            className="border rounded-lg p-3 bg-white"
          >
            <option value="">All Boroughs</option>
            {BOROUGHS.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="text-red-600 mb-4">
          Error: {error}
        </p>
      )}

      {loading ? (
        <p>Loading applications...</p>
      ) : !error ? (
        <>
          <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-4">Volunteer</th>
                  <th className="p-4">Opportunity</th>
                  <th className="p-4">Organization</th>
                  <th className="p-4">Borough</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Applied Date</th>
                </tr>
              </thead>

              <tbody>
                {applications.map((app) => (
                  <tr key={app.id} className="border-t">
                    <td className="p-4">
                      <p className="font-medium">
                        {app.volunteerName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {app.volunteerEmail}
                      </p>
                    </td>

                    <td className="p-4">
                      {app.opportunityTitle}
                    </td>

                    <td className="p-4">
                      {app.organizationName}
                    </td>

                    <td className="p-4">
                      {boroughLabel(app.borough)}
                    </td>

                    <td className="p-4 capitalize">
                      <span
                        className={
                          app.status === 'accepted'
                            ? 'text-green-700 font-semibold'
                            : app.status === 'rejected'
                            ? 'text-red-600 font-semibold'
                            : 'text-yellow-700 font-semibold'
                        }
                      >
                        {app.status}
                      </span>
                    </td>

                    <td className="p-4">
                      {app.appliedAt
                        ? new Date(app.appliedAt).toLocaleDateString()
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {applications.length === 0 && (
              <p className="p-6 text-gray-500">
                No applications found.
              </p>
            )}
          </div>

          <div className="flex items-center gap-4 mt-6">
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={loading || page === 0}
              className="border rounded px-4 py-2 disabled:opacity-40"
            >
              Previous
            </button>

            <span>
              Page {page + 1} of {Math.max(1, Math.ceil(total / limit))}
            </span>

            <button
              onClick={() => setPage(p => p + 1)}
              disabled={loading || (page + 1) * limit >= total}
              className="border rounded px-4 py-2 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </>
      ) : null}
    </main>
  );
}

export default function ApplicationsPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <ApplicationsContent />
    </ProtectedRoute>
  );
}
