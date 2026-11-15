import { createClient } from '@supabase/supabase-js';

// A client scoped to the caller's JWT, so Supabase RLS sees auth.uid().
function supabaseForToken(token) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const supabase = supabaseForToken(token);

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    const { data, error } = await supabase
      .from('applications')
      .select(
        `
        id,
        status,
        applied_at,
        opportunities (
          id,
          title,
          organizations (id, name)
        )
        `
      )
      .eq('volunteer_id', user.id)
      .order('applied_at', { ascending: false });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    const formatted = data.map((app) => ({
      id: app.id,
      status: app.status,
      appliedAt: app.applied_at,
      opportunityId: app.opportunities?.id ?? null,
      opportunityTitle: app.opportunities?.title ?? 'Opportunity unavailable',
      organizationName: app.opportunities?.organizations?.name ?? '—',
    }));

    return res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
