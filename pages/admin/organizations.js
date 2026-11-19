import { useEffect, useState } from 'react';
import ProtectedRoute from '../../components/shared/ProtectedRoute';
import { fetchApi } from '../../lib/fetchApi';

function OrganizationsContent() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const limit = 20;
  const [updatingId, setUpdatingId] = useState(null);

  async function updateVerification(org) {
    const newStatus = !org.verified;

    const confirmed = window.confirm(
      `Are you sure you want to ${newStatus ? 'verify' : 'unverify'} ${org.name}?`
    );

    if (!confirmed) return;

    setUpdatingId(org.id);
    setError('');

    try {
      const result = await fetchApi(
        `/api/admin/organization/${org.id}/verify`,
        {
          method: 'PUT',
          body: { verified: newStatus },
        }
      );

      setOrganizations((current) =>
        current.map((item) =>
          item.id === org.id
            ? { ...item, verified: result.data.verified }
            : item
        )
      );
    } catch (err) {
      setError(err.message || 'Failed to update verification');
    } finally {
      setUpdatingId(null);
    }
  }


  useEffect(() => {
    let active = true;

    async function loadOrganizations() {
      setLoading(true);
      setError('');

      try {
        const result = await fetchApi(
          `/api/admin/organizations?limit=${limit}&offset=${page * limit}`
        );

        if (active) {
          setOrganizations(result.data || []);
          setTotal(result.total || 0);
        }
      } catch (err) {
        if (active) {
          setError(err.message);
          setOrganizations([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadOrganizations();

    return () => {
      active = false;
    };
  }, [page]);

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-2">
        Organization Management
      </h1>

      <p className="text-gray-600 mb-6">
        View registered organizations and their verification status.
      </p>

      {error && (
        <p className="text-red-600 mb-4">
          Error: {error}
        </p>
      )}

      {loading ? (
        <p>Loading organizations...</p>
      ) : !error ? (
        <>
          <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-4">Organization</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Opportunities</th>
                  <th className="p-4">Verification</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {organizations.map((org) => (
                  <tr key={org.id} className="border-t">
                    <td className="p-4 font-medium">
                      {org.name}
                    </td>

                    <td className="p-4">
                      {org.email}
                    </td>

                    <td className="p-4">
                      {org.opportunitiesCount}
                    </td>

                    <td className="p-4">
                      <span
                        className={
                          org.verified
                            ? 'text-green-700 font-semibold'
                            : 'text-yellow-700 font-semibold'
                        }
                      >
                        {org.verified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => updateVerification(org)}
                        disabled={updatingId !== null}
                        className={`rounded px-4 py-2 text-white disabled:opacity-50 ${
                          org.verified
                            ? 'bg-red-600'
                            : 'bg-blue-600'
                        }`}
                      >
                        {updatingId === org.id
                          ? 'Updating...'
                          : org.verified
                            ? 'Unverify'
                            : 'Verify'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {organizations.length === 0 && (
              <p className="p-6 text-gray-500">
                No organizations found.
              </p>
            )}
          </div>

          <div className="flex items-center gap-4 mt-6">
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={page === 0}
              className="border rounded px-4 py-2 disabled:opacity-40"
            >
              Previous
            </button>

            <span>
              Page {page + 1} of {Math.max(1, Math.ceil(total / limit))}
            </span>

            <button
              onClick={() => setPage(p => p + 1)}
              disabled={(page + 1) * limit >= total}
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

export default function OrganizationsPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <OrganizationsContent />
    </ProtectedRoute>
  );
}
