// Browser-side session helpers. The JWT and role live in localStorage
// (the existing convention used by fetchApi, ProfileForm, etc.).

const DASHBOARDS = {
  volunteer: '/volunteer/dashboard',
  organization: '/organization/dashboard',
  admin: '/admin/dashboard',
};

export function dashboardFor(role) {
  return DASHBOARDS[role] || '/volunteer/browse';
}

export function saveSession({ token, role }) {
  localStorage.setItem('token', token);
  if (role) localStorage.setItem('role', role);
  else localStorage.removeItem('role');
}

export function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
}

/**
 * Only follow `?next=` values that are paths on this site, so a crafted link
 * can't bounce users to another domain after they log in.
 */
export function safeNextPath(next) {
  const value = Array.isArray(next) ? next[0] : next;
  if (typeof value !== 'string') return null;
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return null;
  return value;
}
