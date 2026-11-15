import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState, useSyncExternalStore } from 'react';
import OpportunityCard from '../../components/shared/OpportunityCard';
import { fetchApi } from '../../lib/fetchApi';
import { BOROUGHS, SKILLS } from '../../lib/opportunity';

const PAGE_SIZE = 12;

// false on the server and during hydration, true after. Lets us read
// router.isReady while rendering without a server/client HTML mismatch.
const noopSubscribe = () => () => {};
const useHydrated = () => useSyncExternalStore(noopSubscribe, () => true, () => false);

const first = (value) => (Array.isArray(value) ? value[0] : value) || '';

/** Filter inputs. Re-mounted (via `key`) whenever the URL filters change. */
function FilterForm({ initialBorough, initialSkill, onSearch, showClear }) {
  const [borough, setBorough] = useState(initialBorough);
  const [skill, setSkill] = useState(initialSkill);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch({ borough, skill });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <label className="block">
        <span className="block text-sm font-medium mb-1">Borough</span>
        <select
          className="px-3 py-2 border rounded bg-transparent"
          value={borough}
          onChange={(e) => setBorough(e.target.value)}
        >
          <option value="">All boroughs</option>
          {BOROUGHS.map((b) => (
            <option key={b.value} value={b.value}>{b.label}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="block text-sm font-medium mb-1">Skill</span>
        <select
          className="px-3 py-2 border rounded bg-transparent"
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
        >
          <option value="">All skills</option>
          {SKILLS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </label>
      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Search
      </button>
      {showClear && (
        <button type="button" className="px-4 py-2 border rounded" onClick={() => onSearch({})}>
          Clear
        </button>
      )}
    </form>
  );
}

// Public page: anyone can browse open opportunities.
// Filters live in the URL (?borough=brooklyn&skill=teaching&page=1) so results can be shared.
export default function BrowseOpportunitiesPage() {
  const router = useRouter();
  const ready = useHydrated() && router.isReady;
  const borough = first(router.query.borough);
  const skill = first(router.query.skill);
  const page = Math.max(0, parseInt(first(router.query.page), 10) || 0);

  const params = new URLSearchParams({ limit: PAGE_SIZE, offset: page * PAGE_SIZE });
  if (borough) params.set('borough', borough);
  if (skill) params.set('skill', skill);
  const requestKey = params.toString();

  // Results are stored with the request they belong to; while the key doesn't
  // match the current URL, we're loading.
  const [response, setResponse] = useState({ key: null, data: [], total: 0, error: '' });
  const loading = !ready || response.key !== requestKey;

  useEffect(() => {
    if (!router.isReady) return;
    let cancelled = false;
    fetchApi(`/api/opportunity/search?${requestKey}`, { auth: false })
      .then((result) => {
        if (cancelled) return;
        setResponse({
          key: requestKey,
          data: result.data,
          total: result.pagination?.total ?? result.data.length,
          error: '',
        });
      })
      .catch((err) => {
        if (!cancelled) setResponse({ key: requestKey, data: [], total: 0, error: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [router.isReady, requestKey]);

  const navigate = ({ borough: b, skill: s, page: p }) => {
    const query = {};
    if (b) query.borough = b;
    if (s) query.skill = s;
    if (p) query.page = p;
    router.push({ pathname: router.pathname, query }, undefined, { shallow: true });
  };

  const { data: results, total, error } = response;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <Head>
        <title>Browse Opportunities</title>
      </Head>
      <main className="max-w-6xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">Browse Opportunities</h1>

        {ready && (
          <FilterForm
            key={`${borough}|${skill}`}
            initialBorough={borough}
            initialSkill={skill}
            onSearch={navigate}
            showClear={Boolean(borough || skill)}
          />
        )}

        {loading && <div>Loading...</div>}
        {!loading && error && <div className="text-red-600">{error}</div>}

        {!loading && !error && (
          <>
            <p className="text-sm text-gray-600">
              {total} opportunit{total === 1 ? 'y' : 'ies'} found
            </p>
            {results.length === 0 ? (
              <p className="text-gray-600">No open opportunities match your filters.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((opp) => (
                  <OpportunityCard key={opp.id} opportunity={opp} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center gap-3">
                <button
                  className="px-3 py-1 border rounded disabled:opacity-40"
                  disabled={page === 0}
                  onClick={() => navigate({ borough, skill, page: page - 1 })}
                >
                  Previous
                </button>
                <span className="text-sm">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  className="px-3 py-1 border rounded disabled:opacity-40"
                  disabled={page + 1 >= totalPages}
                  onClick={() => navigate({ borough, skill, page: page + 1 })}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
