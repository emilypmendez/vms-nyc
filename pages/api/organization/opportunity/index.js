import { authenticateOrganization, sendError } from '../../../../lib/supabase';
import { createOpportunity } from '../../../../lib/organizationApi';

// POST /api/organization/opportunity -> create an opportunity
// Alias kept so the path in 03_API_SPECIFICATIONS.md works too.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendError(res, 405, 'Method not allowed');
  }

  try {
    const auth = await authenticateOrganization(req);
    if (auth.error) return sendError(res, auth.statusCode, auth.error);
    return createOpportunity(req, res, auth);
  } catch (error) {
    return sendError(res, 500, error.message || 'Internal server error');
  }
}
