import { authenticateOrganization, sendError } from '../../../../lib/supabase';
import { formatOpportunity, validateOpportunity } from '../../../../lib/opportunity';

// POST /api/organization/opportunity -> create an opportunity for the current org
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendError(res, 405, 'Method not allowed');
  }

  try {
    const auth = await authenticateOrganization(req);
    if (auth.error) return sendError(res, auth.statusCode, auth.error);

    const { errors, row } = validateOpportunity(req.body || {});
    if (Object.keys(errors).length) return sendError(res, 422, 'Validation failed', errors);

    const { data, error } = await auth.supabase
      .from('opportunities')
      .insert({
        ...row,
        organization_id: auth.user.id, // always from the token, never from the request body
        status: 'open',
      })
      .select()
      .single();

    if (error) return sendError(res, 400, error.message);

    return res.status(201).json({
      success: true,
      data: formatOpportunity(data),
      message: 'Opportunity created',
    });
  } catch (error) {
    return sendError(res, 500, error.message || 'Internal server error');
  }
}
