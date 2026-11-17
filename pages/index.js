import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { dashboardFor } from '../lib/auth';

const readRole = () => (localStorage.getItem('token') ? localStorage.getItem('role') || '' : null);

// Logged-in role from localStorage, or null when logged out. Starts as null so
// the server render and the first client render match, then reads the real
// value after mount (and when another tab logs in or out).
function useSignedInRole() {
  const [role, setRole] = useState(null);
  useEffect(() => {
    const update = () => setRole(readRole());
    update();
    window.addEventListener('storage', update);
    return () => window.removeEventListener('storage', update);
  }, []);
  return role;
}

const buttonPrimary = 'px-5 py-2.5 bg-blue-600 text-white rounded hover:bg-blue-700';
const buttonSecondary = 'px-5 py-2.5 border rounded hover:bg-gray-500/10';

export default function HomePage() {
  const role = useSignedInRole();
  const signedIn = role !== null;

  return (
    <>
      <Head>
        <title>NYC Volunteer Match</title>
      </Head>
      <main className="max-w-3xl mx-auto px-4 py-16 space-y-12">
        <section className="space-y-4">
          <h1 className="text-3xl sm:text-4xl font-bold">Volunteer in your borough</h1>
          <p className="text-lg text-gray-500">
            Find volunteer opportunities across New York City, or post one for your organization
            and review who applies.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/volunteer/browse" className={buttonPrimary}>
              Browse opportunities
            </Link>
            {signedIn ? (
              <Link href={dashboardFor(role)} className={buttonSecondary}>
                Go to your dashboard
              </Link>
            ) : (
              <>
                <Link href="/auth/signup" className={buttonSecondary}>
                  Sign up
                </Link>
                <Link href="/auth/login" className={buttonSecondary}>
                  Log in
                </Link>
              </>
            )}
          </div>
        </section>

        <section className="grid gap-6 sm:grid-cols-2">
          <div className="border rounded p-5 space-y-2">
            <h2 className="font-semibold text-lg">For volunteers</h2>
            <p className="text-sm text-gray-500">
              Filter by borough and skill, apply in one click, and track your applications from
              your dashboard.
            </p>
          </div>
          <div className="border rounded p-5 space-y-2">
            <h2 className="font-semibold text-lg">For organizations</h2>
            <p className="text-sm text-gray-500">
              Post opportunities with the skills you need, set how many volunteers you want, and
              update or close them any time.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
