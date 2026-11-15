import { getBearerToken, getSupabase, sendError } from '../../../lib/supabase';
import { formatOpportunity } from '../../../lib/opportunity';

// GET /api/opportunity/:id -> public opportunity detail (no auth required)
//
// RLS (`opportunities_public_read`) only returns open opportunities, unless the
// caller is the owning organization. If a token is sent, we pass it on so an
// org can also preview its own filled or closed opportunities.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendError(res, 405, 'Method not allowed');
  }

  try {
    const supabase = getSupabase(getBearerToken(req));

    const { data, error } = await supabase
      .from('opportunities')
      .select('*, organizations (id, name, email)')
      .eq('id', req.query.id)
      .maybeSingle();

    // An invalid UUID makes Postgres error; treat it as not found.
    if (error?.code === '22P02') return sendError(res, 404, 'Resource not found');
    if (error) return sendError(res, 400, error.message);
    if (!data) return sendError(res, 404, 'Resource not found');

    // Note: organizationName is null until the `organizations_public_read`
    // policy from supabase/week3_policies.sql is added.
    return res.status(200).json({ success: true, data: formatOpportunity(data) });
  } catch (error) {
    return sendError(res, 500, error.message || 'Internal server error');
  }
}
