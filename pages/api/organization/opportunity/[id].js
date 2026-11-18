import { authenticateOrganization, sendError } from '../../../../lib/supabase';
import { formatOpportunity, validateOpportunity } from '../../../../lib/opportunity';

// GET /api/organization/opportunity/:id -> one of the current org's opportunities
// PUT /api/organization/opportunity/:id -> update it (any subset of fields, incl. status)
export default async function handler(req, res) {
  if (!['GET', 'PUT'].includes(req.method)) {
    res.setHeader('Allow', 'GET, PUT');
    return sendError(res, 405, 'Method not allowed');
  }

  const { id } = req.query;

  try {
    const auth = await authenticateOrganization(req);
    if (auth.error) return sendError(res, auth.statusCode, auth.error);

    if (req.method === 'GET') {
      const { data, error } = await auth.supabase
        .from('opportunities')
        .select('*, applications(count)')
        .eq('id', id)
        .eq('organization_id', auth.user.id)
        .maybeSingle();

      if (error) return sendError(res, 400, error.message);
      if (!data) return sendError(res, 404, 'Resource not found');

      return res.status(200).json({ success: true, data: formatOpportunity(data) });
    }

    // PUT
    const { errors, row } = validateOpportunity(req.body || {}, { partial: true });
    if (Object.keys(errors).length) return sendError(res, 422, 'Validation failed', errors);
    if (!Object.keys(row).length) return sendError(res, 422, 'No fields to update');

    // If only one date was sent, check it against the stored one.
    if ((row.start_date !== undefined) !== (row.end_date !== undefined)) {
      const { data: current } = await auth.supabase
        .from('opportunities')
        .select('start_date, end_date')
        .eq('id', id)
        .eq('organization_id', auth.user.id)
        .maybeSingle();
      const start = row.start_date !== undefined ? row.start_date : current?.start_date;
      const end = row.end_date !== undefined ? row.end_date : current?.end_date;
      if (start && end && end < start) {
        return sendError(res, 422, 'Validation failed', {
          endDate: 'End date cannot be before start date',
        });
      }
    }

    row.updated_at = new Date().toISOString();

    const { data, error } = await auth.supabase
      .from('opportunities')
      .update(row)
      .eq('id', id)
      .eq('organization_id', auth.user.id)
      .select('*, applications(count)')
      .maybeSingle();

    if (error) return sendError(res, 400, error.message);
    if (!data) return sendError(res, 404, 'Resource not found');

    return res.status(200).json({
      success: true,
      data: formatOpportunity(data),
      message: 'Opportunity updated',
    });
  } catch (error) {
    return sendError(res, 500, error.message || 'Internal server error');
  }
}
