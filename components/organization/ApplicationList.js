import { useCallback, useEffect, useState } from 'react';
import ApplicationDetail, { ReviewStatusBadge, formatDate } from './ApplicationDetail';
import { skillLabel } from '../../lib/volunteerOptions';

// Lists every application to one of the organization's opportunities and
// opens ApplicationDetail to accept or reject one.
export default function ApplicationList({ opportunityId }) {
  const [applications, setApplications] = useState([]);
  const [opportunity, setOpportunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (!opportunityId) return;
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(`/api/organization/opportunity/${opportunityId}/applications`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const result = await res.json();
        if (cancelled) return;
        if (!result.success) {
          setError(result.error || 'Could not load applications');
          return;
        }
        setApplications(result.data);
        setOpportunity(result.opportunity ?? null);
        setError('');
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [opportunityId]);

  const handleReviewed = useCallback((applicationId, updated) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === applicationId
          ? { ...app, status: updated.status, notes: updated.notes, reviewedAt: updated.reviewedAt }
          : app
      )
    );
    setSelectedId(null);
  }, []);

  const closeDetail = useCallback(() => setSelectedId(null), []);

  if (loading) return <p className="text-sm text-gray-500">Loading applications…</p>;

  if (error) {
    return (
      <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
        {error}
      </p>
    );
  }

  const selected = applications.find((app) => app.id === selectedId);
  const pendingCount = applications.filter((a) => a.status === 'pending').length;
  const acceptedCount = applications.filter((a) => a.status === 'accepted').length;
  const opportunityInfo = opportunity ? { ...opportunity, acceptedCount } : null;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-gray-900">
          Applications <span className="font-normal text-gray-500">({applications.length})</span>
        </h2>
        {opportunity && (
          <p className="text-sm text-gray-600">
            {pendingCount} pending · {acceptedCount} of {opportunity.slotsAvailable} slots filled
          </p>
        )}
      </div>

      {applications.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-600">
          No one has applied to this opportunity yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-2 text-left font-semibold text-gray-700">Volunteer</th>
                <th scope="col" className="px-4 py-2 text-left font-semibold text-gray-700">Skills</th>
                <th scope="col" className="px-4 py-2 text-left font-semibold text-gray-700">Status</th>
                <th scope="col" className="px-4 py-2 text-left font-semibold text-gray-700">Applied</th>
                <th scope="col" className="px-4 py-2 text-left font-semibold text-gray-700">Notes</th>
                <th scope="col" className="px-4 py-2 text-right font-semibold text-gray-700">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {applications.map((app) => (
                <tr key={app.id}>
                  <td className="px-4 py-2">
                    <div className="font-medium text-gray-900">{app.volunteerName}</div>
                    <div className="text-gray-500">{app.volunteerEmail ?? '—'}</div>
                  </td>
                  <td className="px-4 py-2 text-gray-700">
                    {app.volunteerSkills.length ? app.volunteerSkills.map(skillLabel).join(', ') : '—'}
                  </td>
                  <td className="px-4 py-2">
                    <ReviewStatusBadge status={app.status} />
                  </td>
                  <td className="px-4 py-2 text-gray-600">{formatDate(app.appliedAt)}</td>
                  <td className="max-w-xs truncate px-4 py-2 text-gray-600" title={app.notes ?? undefined}>
                    {app.notes || '—'}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedId(app.id)}
                      className="rounded border border-blue-600 px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50"
                    >
                      {app.status === 'pending' ? 'Review' : 'View'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <ApplicationDetail
          key={selected.id}
          application={selected}
          opportunity={opportunityInfo}
          onClose={closeDetail}
          onReviewed={handleReviewed}
        />
      )}
    </section>
  );
}
