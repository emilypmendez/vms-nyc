import { authenticateOrganization, sendError } from '../../../lib/supabase';
import { formatOpportunity } from '../../../lib/opportunity';
import { createOpportunity } from '../../../lib/organizationApi';

// GET  /api/organization/opportunities -> all opportunities posted by the current org
// POST /api/organization/opportunities -> create a new opportunity
//      (03_API_SPECIFICATIONS.md lists this as POST /api/organization/opportunity;
//       both paths work, see pages/api/organization/opportunity/index.js)
export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return sendError(res, 405, 'Method not allowed');
  }

  try {
    const auth = await authenticateOrganization(req);
    if (auth.error) return sendError(res, auth.statusCode, auth.error);

    if (req.method === 'GET') {
      const { data, error } = await auth.supabase
        .from('opportunities')
        .select('*, applications(count)')
        .eq('organization_id', auth.user.id)
        .order('created_at', { ascending: false });

      if (error) return sendError(res, 400, error.message);

      return res.status(200).json({ success: true, data: data.map(formatOpportunity) });
    }

    return createOpportunity(req, res, auth);
  } catch (error) {
    return sendError(res, 500, error.message || 'Internal server error');
  }
}
