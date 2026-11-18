import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import OpportunityApplyButton from '../../../components/volunteer/OpportunityApplyButton';
import { fetchApi } from '../../../lib/fetchApi';
import { BOROUGHS, COMMITMENTS, SKILLS, labelFor } from '../../../lib/opportunity';

function formatDate(date) {
  // Dates come as YYYY-MM-DD; parse as local time so the day doesn't shift.
  return date ? new Date(`${date}T00:00:00`).toLocaleDateString() : null;
}

export default function VolunteerOpportunityPage() {
  const router = useRouter();
  const id = router.isReady ? router.query.id : null;
  const [opp, setOpp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    fetchApi(`/api/opportunity/${id}`)
      .then((result) => setOpp(result.data))
      .catch((err) =>
        setError(err.status === 404 ? 'This opportunity is not available.' : err.message)
      )
      .finally(() => setLoading(false));
  }, [id]);

  const start = formatDate(opp?.startDate);
  const end = formatDate(opp?.endDate);

  return (
    <>
      <Head>
        <title>{opp ? opp.title : 'Opportunity'}</title>
      </Head>
      <main className="max-w-3xl mx-auto p-6 space-y-6">
        <Link href="/volunteer/browse" className="text-blue-600 text-sm hover:underline">
          &larr; Back to opportunities
        </Link>

        {loading && <div>Loading...</div>}
        {error && <div className="text-red-600">{error}</div>}

        {opp && !loading && (
          <article className="space-y-6">
            <header>
              <h1 className="text-2xl font-bold">{opp.title}</h1>
              {opp.organizationName && (
                <p className="text-gray-600">{opp.organizationName}</p>
              )}
            </header>

            <p className="whitespace-pre-line">{opp.description}</p>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="font-medium">Commitment</dt>
                <dd>{labelFor(COMMITMENTS, opp.commitment)}</dd>
              </div>
              <div>
                <dt className="font-medium">Volunteers needed</dt>
                <dd>{opp.slotsAvailable}</dd>
              </div>
              {opp.borough && (
                <div>
                  <dt className="font-medium">Borough</dt>
                  <dd>{labelFor(BOROUGHS, opp.borough)}</dd>
                </div>
              )}
              {opp.location && (
                <div>
                  <dt className="font-medium">Location</dt>
                  <dd>{opp.location}</dd>
                </div>
              )}
              {(start || end) && (
                <div>
                  <dt className="font-medium">Dates</dt>
                  <dd>{start && end ? `${start} – ${end}` : start || `Until ${end}`}</dd>
                </div>
              )}
              {opp.requiredSkills?.length > 0 && (
                <div>
                  <dt className="font-medium">Required skills</dt>
                  <dd className="flex flex-wrap gap-2 mt-1">
                    {opp.requiredSkills.map((skill) => (
                      <span key={skill} className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                        {labelFor(SKILLS, skill)}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>

            {opp.status === 'open' ? (
              <OpportunityApplyButton opportunityId={opp.id} />
            ) : (
              <p className="text-gray-600">This opportunity is no longer accepting applications.</p>
            )}
          </article>
        )}
      </main>
    </>
  );
}
