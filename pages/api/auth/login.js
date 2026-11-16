import { getSupabase } from '../../../lib/supabase';

// POST /api/auth/login { email, password }
// -> { session, user, role }
//
// `role` comes from profiles.role (read with the new session's token), falling
// back to user_metadata.role for users created by hand in Supabase.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(422).json({
      success: false,
      error: 'Email and password required',
    });
  }

  try {
    // A fresh client per request with no persisted session, so one user's
    // login can't leak into another request on the same server.
    const { data, error } = await getSupabase().auth.signInWithPassword({ email, password });

    if (error) {
      return res.status(401).json({ success: false, error: error.message });
    }

    const { data: profile } = await getSupabase(data.session.access_token)
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle();

    return res.status(200).json({
      success: true,
      data: {
        session: data.session,
        user: data.user,
        role: profile?.role ?? data.user.user_metadata?.role ?? null,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
