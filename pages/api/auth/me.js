import { getBearerToken, getSupabase } from '../../../lib/supabase';

// GET /api/auth/me -> { user, profile, role } for the token's user.
//
// The profile is read with the user's own token so the `profiles_read_own`
// RLS policy applies. `role` prefers profiles.role (the source of truth) and
// falls back to user_metadata.role for users created by hand in Supabase.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ success: false, error: 'No authorization token' });
  }

  try {
    const supabase = getSupabase(token);
    const { data: { user } = {}, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    return res.status(200).json({
      success: true,
      data: {
        user,
        profile,
        role: profile?.role ?? user.user_metadata?.role ?? null,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
