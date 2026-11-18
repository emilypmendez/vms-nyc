import { useEffect, useState } from 'react';
import { fetchApi } from '../../lib/fetchApi';
import OpportunityForm from './OpportunityForm';
import { StatusBadge } from './OpportunityList';

/** Load one of the org's opportunities and let them edit it. */
export default function OpportunityDetail({ id }) {
  const [opportunity, setOpportunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // `loading` starts true; the page only renders this component once `id` is known.
  useEffect(() => {
    if (!id) return;
    fetchApi(`/api/organization/opportunity/${id}`)
      .then((result) => setOpportunity(result.data))
      .catch((err) => setError(err.status === 404 ? 'Opportunity not found' : err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async (payload) => {
    setMessage('');
    const result = await fetchApi(`/api/organization/opportunity/${id}`, {
      method: 'PUT',
      body: payload,
    });
    setOpportunity(result.data);
    setMessage('Changes saved.');
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!opportunity) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{opportunity.title}</h1>
        <StatusBadge status={opportunity.status} />
        <span className="text-sm text-gray-600">
          {opportunity.totalApplications ?? 0} application(s)
        </span>
      </div>

      {message && <div className="text-green-700 text-sm">{message}</div>}

      <OpportunityForm
        // key forces the form to re-initialize after a save returns fresh data
        key={opportunity.updatedAt || opportunity.id}
        initialValues={opportunity}
        onSubmit={handleSave}
        submitLabel="Save Changes"
        showStatus
      />
    </div>
  );
}
