import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import ProtectedRoute from '../../components/shared/ProtectedRoute';
import { fetchApi } from '../../lib/fetchApi';
import { BOROUGHS, STATUSES, labelFor } from '../../lib/opportunity';

function OpportunitiesContent() {
  const [opportunities, setOpportunities] = useState([]);
  const [borough, setBorough] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // A6: Track updates and reload the opportunity list.
  const [refreshCount, setRefreshCount] = useState(0);
  const [updatingId, setUpdatingId] = useState(null);
  const [actionError, setActionError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const limit = 20;

  useEffect(() => {
    let active = true;

    async function loadOpportunities() {
      setLoading(true);
      setError('');

      try {
        const params = new URLSearchParams({
          limit: String(limit),
          offset: String(page * limit),
        });

        if (borough) params.set('borough', borough);
        if (status) params.set('status', status);

        const result = await fetchApi(
          `/api/admin/opportunities?${params.toString()}`
        );

        if (active) {
          setOpportunities(result.data || []);
          setTotal(result.total || 0);
        }
      } catch (err) {
        if (active) {
          setError(err.message);
          setOpportunities([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadOpportunities();

    return () => {
      active = false;
    };
  }, [borough, status, page, refreshCount]);

  // A6: Close or reopen an opportunity.
  async function handleStatusChange(opp) {
    if (opp.status !== 'open' && opp.status !== 'closed') {
      return;
    }

    const nextStatus =
      opp.status === 'open' ? 'closed' : 'open';

    const action =
      nextStatus === 'closed' ? 'close' : 'reopen';

    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${opp.title}"?`
    );

    if (!confirmed) return;

    setUpdatingId(opp.id);
    setActionError('');
    setActionMessage('');

    try {
      const result = await fetchApi(
        '/api/admin/opportunities',
        {
          method: 'PATCH',
          body: {
            id: opp.id,
            status: nextStatus,
          },
        }
      );

      setActionMessage(
        result.message || 'Opportunity updated successfully.'
      );

      // Reload with the current filters and pagination.
      setRefreshCount((count) => count + 1);
    } catch (err) {
      setActionError(
        err.message || 'Failed to update opportunity.'
      );

      // Reload after a conflict to show the latest status.
      if (err.status === 409) {
        setRefreshCount((count) => count + 1);
      }
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <Head>
        <title>Opportunities · Admin</title>
      </Head>

      <Link
        href="/admin/dashboard"
        className="mb-3 inline-block text-blue-600 text-sm hover:underline"
      >
        &larr; Back to admin dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-2">
        Opportunity Monitoring
      </h1>

      <p className="text-gray-600 mb-6">
        View, monitor, close, and reopen volunteer opportunities
        across NYC.
      </p>

      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block mb-2 font-medium">
            Filter by borough
          </label>

          <select
            value={borough}
            onChange={(e) => {
              setBorough(e.target.value);
              setPage(0);
              setActionMessage('');
              setActionError('');
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

        <div>
          <label className="block mb-2 font-medium">
            Filter by status
          </label>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
              setActionMessage('');
              setActionError('');
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
      </div>

      {error && (
        <p role="alert" className="text-red-600 mb-4">
          Error: {error}
        </p>
      )}

      {actionError && (
        <p role="alert" className="text-red-600 mb-4">
          {actionError}
        </p>
      )}

      {actionMessage && (
        <p role="status" className="text-green-700 mb-4">
          {actionMessage}
        </p>
      )}

      {loading ? (
        <p>Loading opportunities...</p>
      ) : !error ? (
        <>
          <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-4">Opportunity</th>
                  <th className="p-4">Organization</th>
                  <th className="p-4">Borough</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Applications</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {opportunities.map((opp) => (
                  <tr key={opp.id} className="border-t">
                    <td className="p-4 font-medium">
                      {opp.title}
                    </td>

                    <td className="p-4">
                      {opp.organizationName}
                    </td>

                    <td className="p-4">
                      {labelFor(BOROUGHS, opp.borough)}
                    </td>

                    <td className="p-4 capitalize">
                      <span
                        className={
                          opp.status === 'open'
                            ? 'text-green-700 font-semibold'
                            : 'text-gray-600 font-semibold'
                        }
                      >
                        {labelFor(STATUSES, opp.status)}
                      </span>
                    </td>

                    <td className="p-4">
                      {opp.applicationsCount}
                    </td>

                    <td className="p-4">
                      {opp.status === 'open' && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(opp)}
                          disabled={updatingId !== null}
                          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          {updatingId === opp.id
                            ? 'Closing...'
                            : 'Close'}
                        </button>
                      )}

                      {opp.status === 'closed' && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(opp)}
                          disabled={updatingId !== null}
                          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          {updatingId === opp.id
                            ? 'Reopening...'
                            : 'Reopen'}
                        </button>
                      )}

                      {opp.status === 'filled' && (
                        <span className="text-gray-500 text-sm">
                          No action
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {opportunities.length === 0 && (
              <p className="p-6 text-gray-500">
                No opportunities found.
              </p>
            )}
          </div>

          <div className="flex items-center gap-4 mt-6">
            <button
              type="button"
              onClick={() => setPage((p) => p - 1)}
              disabled={loading || updatingId !== null || page === 0}
              className="border rounded px-4 py-2 disabled:opacity-40"
            >
              Previous
            </button>

            <span>
              Page {page + 1} of{' '}
              {Math.max(1, Math.ceil(total / limit))}
            </span>

            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={
                loading ||
                updatingId !== null ||
                (page + 1) * limit >= total
              }
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

export default function OpportunitiesPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <OpportunitiesContent />
    </ProtectedRoute>
  );
}
