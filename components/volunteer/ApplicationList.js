import Link from 'next/link';
import ApplicationStatus from './ApplicationStatus';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function ApplicationList({ applications = [], loading = false, error = '' }) {
  if (loading) {
    return <p className="text-sm text-gray-500">Loading applications…</p>;
  }

  if (error) {
    return (
      <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
        {error}
      </p>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
        <p className="text-sm text-gray-600">You haven&apos;t applied to any opportunities yet.</p>
        <Link
          href="/volunteer/browse"
          className="mt-2 inline-block text-sm font-medium text-blue-600 hover:underline"
        >
          Browse opportunities
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-4 py-2 text-left font-semibold text-gray-700">Opportunity</th>
            <th scope="col" className="px-4 py-2 text-left font-semibold text-gray-700">Organization</th>
            <th scope="col" className="px-4 py-2 text-left font-semibold text-gray-700">Status</th>
            <th scope="col" className="px-4 py-2 text-left font-semibold text-gray-700">Applied</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {applications.map((app) => (
            <tr key={app.id}>
              <td className="px-4 py-2 text-gray-900">
                {app.opportunityId ? (
                  <Link
                    href={`/volunteer/opportunity/${app.opportunityId}`}
                    className="text-blue-600 hover:underline"
                  >
                    {app.opportunityTitle}
                  </Link>
                ) : (
                  app.opportunityTitle
                )}
              </td>
              <td className="px-4 py-2 text-gray-700">{app.organizationName}</td>
              <td className="px-4 py-2">
                <ApplicationStatus status={app.status} />
              </td>
              <td className="px-4 py-2 text-gray-600">{formatDate(app.appliedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
