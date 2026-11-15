import { useEffect, useState } from 'react';
import Link from 'next/link';
import ApplicationList from './ApplicationList';
import { availabilityLabel, boroughLabel, skillLabel } from '../../lib/volunteerOptions';

async function fetchJson(url) {
  const token = localStorage.getItem('token');
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const result = await res.json();
  if (!result.success) throw new Error(result.error || 'Request failed');
  return result.data;
}

export default function VolunteerDashboard() {
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState('');
  const [applications, setApplications] = useState([]);
  const [appsError, setAppsError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([
      fetchJson('/api/volunteer/profile'),
      fetchJson('/api/volunteer/applications'),
    ]).then(([profileResult, appsResult]) => {
      if (cancelled) return;
      if (profileResult.status === 'fulfilled') setProfile(profileResult.value);
      else setProfileError(profileResult.reason.message);
      if (appsResult.status === 'fulfilled') setApplications(appsResult.value);
      else setAppsError(appsResult.reason.message);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const fullName = profile ? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() : '';
  const profileIncomplete = profile && (!profile.borough || profile.skills.length === 0);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-500">Volunteer dashboard</p>
          <h1 className="text-2xl font-bold text-gray-900">
            {loading ? 'Loading…' : fullName ? `Welcome, ${fullName}` : 'Welcome'}
          </h1>
        </div>
        <div className="flex gap-3">
          <Link
            href="/volunteer/profile"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Edit profile
          </Link>
          <Link
            href="/volunteer/browse"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Browse opportunities
          </Link>
        </div>
      </header>

      <section aria-labelledby="profile-heading" className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 id="profile-heading" className="mb-4 text-lg font-semibold text-gray-900">
          Your profile
        </h2>

        {loading && <p className="text-sm text-gray-500">Loading profile…</p>}

        {!loading && profileError && (
          <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {profileError}
          </p>
        )}

        {!loading && profile && (
          <div className="space-y-4">
            {profileIncomplete && (
              <p className="rounded-md bg-blue-50 p-3 text-sm text-blue-800">
                Add your borough and skills so organizations can find you.{' '}
                <Link href="/volunteer/profile" className="font-medium underline">
                  Complete your profile
                </Link>
              </p>
            )}

            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Borough</dt>
                <dd className="mt-1 text-gray-900">
                  {profile.borough ? boroughLabel(profile.borough) : 'Not set'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Availability</dt>
                <dd className="mt-1 text-gray-900">
                  {profile.availability ? availabilityLabel(profile.availability) : 'Not set'}
                </dd>
              </div>
            </dl>

            <div>
              <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500">Skills</h3>
              {profile.skills.length ? (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <li
                      key={skill}
                      className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-800"
                    >
                      {skillLabel(skill)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-gray-900">No skills added yet</p>
              )}
            </div>

            {profile.bio && (
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500">About</h3>
                <p className="mt-1 whitespace-pre-line text-gray-900">{profile.bio}</p>
              </div>
            )}
          </div>
        )}
      </section>

      <section aria-labelledby="applications-heading" className="space-y-4">
        <h2 id="applications-heading" className="text-lg font-semibold text-gray-900">
          My applications
        </h2>
        <ApplicationList applications={applications} loading={loading} error={appsError} />
      </section>
    </div>
  );
}
