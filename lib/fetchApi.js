// Small browser-side helper for calling our /api routes.
// Adds the JWT from localStorage and throws on `{ success: false }` responses.

export async function fetchApi(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  if (auth) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let result = null;
  try {
    result = await res.json();
  } catch {
    // Non-JSON response (for example, a crashed route); handled below.
  }

  if (!res.ok || !result?.success) {
    const error = new Error(result?.error || `Request failed (${res.status})`);
    error.status = res.status;
    error.details = result?.details;
    throw error;
  }

  return result;
}
