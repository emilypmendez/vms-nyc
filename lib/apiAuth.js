import { createClient } from '@supabase/supabase-js';

// Server-side helpers shared by the API routes.
//
// Every request gets a Supabase client scoped to the caller's JWT, so RLS
// sees auth.uid() and enforces row access in the database. The anon key on
// its own would make every query run as an anonymous user.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value) {
  return typeof value === 'string' && UUID_RE.test(value);
}

export function sendError(res, statusCode, error, details) {
  const body = { success: false, error, statusCode };
  if (details) body.details = details;
  return res.status(statusCode).json(body);
}

// Returns false (after sending 405) when req.method isn't allowed.
export function allowMethods(req, res, methods) {
  if (methods.includes(req.method)) return true;
  res.setHeader('Allow', methods.join(', '));
  sendError(res, 405, 'Method not allowed');
  return false;
}

export function getBearerToken(req) {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token : null;
}

export function supabaseForToken(token) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}

// Verifies the caller's JWT. On success returns { supabase, user }.
// On failure it has already sent the error response and returns null.
export async function authenticate(req, res) {
  const token = getBearerToken(req);
  if (!token) {
    sendError(res, 401, 'Unauthorized');
    return null;
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    sendError(res, 500, 'Supabase is not configured (check .env.local)');
    return null;
  }

  const supabase = supabaseForToken(token);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    sendError(res, 401, 'Invalid token');
    return null;
  }

  return { supabase, user: data.user };
}
