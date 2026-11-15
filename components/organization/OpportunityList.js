import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchApi } from '../../lib/fetchApi';
import { BOROUGHS, COMMITMENTS, labelFor } from '../../lib/opportunity';

export const STATUS_STYLES = {
  open: 'bg-green-100 text-green-800',
  filled: 'bg-blue-100 text-blue-800',
  closed: 'bg-gray-200 text-gray-700',
};

export function StatusBadge({ status }) {
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_STYLES[status] || ''}`}>
      {status}
    </span>
  );
}

/** Table of the logged-in organization's opportunities. */
export default function OpportunityList() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApi('/api/organization/opportunities')
      .then((result) => setOpportunities(result.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading opportunities...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  if (opportunities.length === 0) {
    return (
      <p className="text-gray-600">
        You haven&apos;t posted any opportunities yet.{' '}
        <Link href="/organization/opportunity/new" className="text-blue-600 hover:underline">
          Create your first one
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2 pr-4">Title</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2 pr-4">Commitment</th>
            <th className="py-2 pr-4">Borough</th>
            <th className="py-2 pr-4">Slots</th>
            <th className="py-2 pr-4">Applications</th>
            <th className="py-2 pr-4">Created</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {opportunities.map((opp) => (
            <tr key={opp.id} className="border-b">
              <td className="py-2 pr-4 font-medium">{opp.title}</td>
              <td className="py-2 pr-4"><StatusBadge status={opp.status} /></td>
              <td className="py-2 pr-4">{labelFor(COMMITMENTS, opp.commitment)}</td>
              <td className="py-2 pr-4">{labelFor(BOROUGHS, opp.borough) || '-'}</td>
              <td className="py-2 pr-4">{opp.slotsAvailable}</td>
              <td className="py-2 pr-4">{opp.totalApplications ?? 0}</td>
              <td className="py-2 pr-4 text-gray-600">
                {opp.createdAt ? new Date(opp.createdAt).toLocaleDateString() : '-'}
              </td>
              <td className="py-2">
                <Link
                  href={`/organization/opportunity/${opp.id}`}
                  className="text-blue-600 hover:underline"
                >
                  View / Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
