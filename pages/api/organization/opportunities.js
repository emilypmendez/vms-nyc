import { authenticateOrganization, sendError } from '../../../lib/supabase';
import { formatOpportunity } from '../../../lib/opportunity';

// GET /api/organization/opportunities -> all opportunities posted by the current org
// (create is POST /api/organization/opportunity, see opportunity/index.js)
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendError(res, 405, 'Method not allowed');
  }

  try {
    const auth = await authenticateOrganization(req);
    if (auth.error) return sendError(res, auth.statusCode, auth.error);

    const { data, error } = await auth.supabase
      .from('opportunities')
      .select('*, applications(count)')
      .eq('organization_id', auth.user.id)
      .order('created_at', { ascending: false });

    if (error) return sendError(res, 400, error.message);

    return res.status(200).json({ success: true, data: data.map(formatOpportunity) });
  } catch (error) {
    return sendError(res, 500, error.message || 'Internal server error');
  }
}
