
import { authenticate } from './supabase';
import { getSupabaseAdmin } from './supabaseAdmin';

export async function authenticateAdmin(req) {
  //Verify the user's login token
  const auth = await authenticate(req);

  if (auth.error) {
    return auth;
  }

  //Server-only client checks the user's stored role
  const admin = getSupabaseAdmin();

  const { data: profile, error } = await admin
    .from('profiles')
    .select('role')
    .eq('id', auth.user.id)
    .maybeSingle();

  if (error) {
    return {
      error: 'Unable to verify admin permissions',
      statusCode: 500,
    };
  }

  if (profile?.role !== 'admin') {
    return {
      error: 'Admin access required',
      statusCode: 403,
    };
  }

  return {
    ...auth,
    admin,
  };
}
