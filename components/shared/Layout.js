import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { clearSession } from '../../lib/auth';
import { fetchApi } from '../../lib/fetchApi';

const roleLinks = {
  volunteer: [
    { label: 'Browse opportunities', href: '/volunteer/browse' },
    { label: 'My dashboard', href: '/volunteer/dashboard' },
    { label: 'Edit profile', href: '/volunteer/profile' },
  ],
  organization: [
    { label: 'Dashboard', href: '/organization/dashboard' },
    { label: 'New opportunity', href: '/organization/opportunity/new' },
  ],
  admin: [
    { label: 'Dashboard', href: '/admin/dashboard' },
    { label: 'Users', href: '/admin/users' },
    { label: 'Organizations', href: '/admin/organizations' },
    { label: 'Opportunities', href: '/admin/opportunities' },
    { label: 'Applications', href: '/admin/applications' },
  ],
};

function readRole() {
  if (typeof window === 'undefined') return null;

  const token = localStorage.getItem('token');
  return token ? localStorage.getItem('role') : null;
}

export default function Layout({ children }) {
  const router = useRouter();
  const [role, setRole] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function refreshRole() {
      setRole(readRole());
      setReady(true);
    }

    refreshRole();

    router.events.on('routeChangeComplete', refreshRole);
    window.addEventListener('storage', refreshRole);
    window.addEventListener('vms-auth-changed', refreshRole);

    return () => {
      router.events.off('routeChangeComplete', refreshRole);
      window.removeEventListener('storage', refreshRole);
      window.removeEventListener('vms-auth-changed', refreshRole);
    };
  }, [router.events]);

  
async function handleLogout() {
    let revokeError = null;
  
    try {
      // Ask Supabase to revoke the current session
      await fetchApi('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Server logout failed:', error);
      revokeError = error;
    } finally {
      // Always clear the browser session
      clearSession();
      setRole(null);
  
      window.dispatchEvent(new Event('vms-auth-changed'));
  
      await router.replace('/');
  
      if (revokeError) {
        window.alert(
          'You have been logged out of this browser, ' +
          'but server-side session revocation could not be confirmed.'
        );
      }
    }
  }
  
  const links = roleLinks[role] || [
    { label: 'Browse opportunities', href: '/volunteer/browse' },
  ];

  return (
    <>
      <header className="bg-white border-b border-gray-200">
        <nav
          aria-label="Main navigation"
          className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4"
        >
          <Link href="/" className="font-bold text-xl text-blue-600">
            VMS-NYC
          </Link>

          {ready && (
            <div className="flex flex-wrap items-center gap-4">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-700 hover:text-blue-600"
                >
                  {link.label}
                </Link>
              ))}

              {role ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700 font-medium"
                >
                  Log out
                </button>
              ) : (
                <>
                  <Link href="/auth/login" className="text-blue-600">
                    Log in
                  </Link>
                  <Link href="/auth/signup" className="text-blue-600">
                    Sign up
                  </Link>
                </>
              )}
            </div>
          )}
        </nav>
      </header>

      {children}
    </>
  );
}
