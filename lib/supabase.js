import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Create a Supabase client.
 *
 * Pass the user's JWT when calling from an API route. Without it, queries run
 * as the anonymous role, `auth.uid()` is NULL inside RLS policies, and inserts
 * like `organization_id = auth.uid()` get rejected.
 */
export function getSupabase(token) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
    );
  }

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  });
}

/** Read the token from an `Authorization: Bearer <token>` header. */
export function getBearerToken(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

/**
 * Authenticate an API request.
 *
 * Returns `{ user, supabase }` where `supabase` runs queries as that user (RLS
 * applies), or `{ error, statusCode }` if the token is missing or invalid.
 */
export async function authenticate(req) {
  const token = getBearerToken(req);
  if (!token) {
    return { error: 'Unauthorized', statusCode: 401 };
  }

  const supabase = getSupabase(token);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return { error: 'Invalid token', statusCode: 401 };
  }

  return { user: data.user, supabase };
}

/**
 * Authenticate a request and require that the user is an organization.
 *
 * We check for the user's row in `organizations` (allowed by the
 * `organizations_own_profile` RLS policy) rather than `profiles.role`, because
 * `profiles` has RLS enabled but no SELECT policy in the setup SQL.
 *
 * Returns `{ user, supabase, organization }` or `{ error, statusCode }`.
 */
export async function authenticateOrganization(req) {
  const auth = await authenticate(req);
  if (auth.error) return auth;

  const { data: organization, error } = await auth.supabase
    .from('organizations')
    .select('*')
    .eq('id', auth.user.id)
    .maybeSingle();

  if (error) return { error: error.message, statusCode: 500 };
  if (!organization) {
    return {
      error: "You don't have permission to access this resource",
      statusCode: 403,
    };
  }

  return { ...auth, organization };
}

/** Send the standard error shape from 03_API_SPECIFICATIONS.md. */
export function sendError(res, statusCode, error, details) {
  return res.status(statusCode).json({
    success: false,
    error,
    ...(details ? { details } : {}),
    statusCode,
  });
}
