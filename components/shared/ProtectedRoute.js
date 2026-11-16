import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { clearSession, dashboardFor, saveSession } from '../../lib/auth';

/**
 * Renders children only for a logged-in user (and, if `requiredRole` is set,
 * only for that role).
 *
 * - No token or an invalid one: go to /auth/login?next=<this page>.
 * - Wrong role: go to that user's own dashboard.
 *
 * The role comes from /api/auth/me (profiles.role), not from localStorage, so
 * it's correct for users created by hand in Supabase too. API routes still do
 * their own checks; this only decides what to render.
 */
export default function ProtectedRoute({ children, requiredRole = null }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    let cancelled = false;

    const toLogin = () =>
      router.replace({ pathname: '/auth/login', query: { next: router.asPath } });

    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) return toLogin();

      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json().catch(() => null);
        if (cancelled) return;

        if (!res.ok || !result?.success) {
          clearSession();
          return toLogin();
        }

        const role = result.data.role;
        saveSession({ token, role }); // keep the cached role in sync

        if (requiredRole && role !== requiredRole) {
          return router.replace(dashboardFor(role));
        }

        setAuthorized(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        if (!cancelled) toLogin();
      }
    };

    checkAuth();
    return () => {
      cancelled = true;
    };
    // router.asPath is read when redirecting; re-checking on every route
    // change isn't needed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, requiredRole]);

  if (!authorized) return <div className="p-6">Loading...</div>;
  return children;
}
