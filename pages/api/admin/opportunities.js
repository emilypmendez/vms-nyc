import { authenticateAdmin } from '../../../lib/authenticateAdmin';
import { allowMethods, sendError } from '../../../lib/supabase';
import { STATUSES } from '../../../lib/opportunity';
import { BOROUGH_VALUES } from '../../../lib/volunteerOptions';

const STATUS_VALUES = STATUSES.map((s) => s.value);

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['GET', 'PATCH'])) return;

  res.setHeader('Cache-Control', 'private, no-store');

  try {
    // Verify that the current user is an administrator.
    const auth = await authenticateAdmin(req);

    if (auth.error) {
      return sendError(res, auth.statusCode, auth.error);
    }

    // ==========================================
    // GET: Retrieve opportunities
    // ==========================================
    if (req.method === 'GET') {
      const borough = req.query.borough ?? '';
      const status = req.query.status ?? '';
      const limit = Number(req.query.limit ?? 20);
      const offset = Number(req.query.offset ?? 0);

      if (
        typeof borough !== 'string' ||
        typeof status !== 'string' ||
        (borough && !BOROUGH_VALUES.includes(borough)) ||
        (status && !STATUS_VALUES.includes(status)) ||
        !Number.isInteger(limit) ||
        limit < 1 || limit > 100 ||
        !Number.isInteger(offset) || offset < 0
      ) {
        return sendError(res, 422, 'Invalid filters or pagination');
      }

      let query = auth.admin
        .from('opportunities')
        .select(
          `id, title, borough, status, created_at,
           organizations(name), applications(count)`,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (borough) query = query.eq('borough', borough);
      if (status) query = query.eq('status', status);

      const { data, count, error } = await query;

      if (error) {
        console.error('Opportunities query error:', error);
        return sendError(
          res,
          500,
          'Failed to retrieve opportunities'
        );
      }

      const opportunities = (data || []).map((opp) => ({
        id: opp.id,
        title: opp.title,
        organizationName: opp.organizations?.name ?? 'Unknown',
        borough: opp.borough,
        status: opp.status,
        applicationsCount: opp.applications?.[0]?.count ?? 0,
        createdAt: opp.created_at,
      }));

      return res.status(200).json({
        success: true,
        data: opportunities,
        total: count ?? 0,
        limit,
        offset,
      });
    }

    // ==========================================
    // PATCH: Close or reopen an opportunity
    // ==========================================
    if (req.method === 'PATCH') {
      const { id, status } = req.body ?? {};

      // Validate opportunity ID.
      if (
        typeof id !== 'string' ||
        !id.trim() ||
        id.length > 100
      ) {
        return sendError(
          res,
          422,
          'A valid opportunity ID is required'
        );
      }

      // Only allow opening or closing opportunities.
      if (status !== 'open' && status !== 'closed') {
        return sendError(
          res,
          422,
          'Status must be open or closed'
        );
      }

      // Closing requires the current status to be open.
      // Reopening requires the current status to be closed.
      // Filled opportunities cannot be changed here.
      const expectedStatus =
        status === 'closed' ? 'open' : 'closed';

      const { data, error } = await auth.admin
        .from('opportunities')
        .update({ status })
        .eq('id', id)
        .eq('status', expectedStatus)
        .select('id, status')
        .maybeSingle();

      if (error) {
        console.error('Opportunity update error:', error);
        return sendError(
          res,
          500,
          'Failed to update opportunity status'
        );
      }

      if (!data) {
        return sendError(
          res,
          409,
          'Opportunity was not found or its status has changed. Refresh and try again.'
        );
      }

      return res.status(200).json({
        success: true,
        message:
          status === 'closed'
            ? 'Opportunity closed successfully'
            : 'Opportunity reopened successfully',
        data: {
          id: data.id,
          status: data.status,
        },
      });
    }
  } catch (error) {
    console.error('Admin opportunities error:', error);
    return sendError(res, 500, 'Internal server error');
  }
}
