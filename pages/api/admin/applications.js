
import { authenticateAdmin } from '../../../lib/authenticateAdmin';
import { allowMethods, sendError } from '../../../lib/supabase';
import { BOROUGH_VALUES } from '../../../lib/volunteerOptions';

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['GET'])) return;

  res.setHeader('Cache-Control', 'private, no-store');

  try {
    const auth = await authenticateAdmin(req);

    if (auth.error) {
      return sendError(res, auth.statusCode, auth.error);
    }

    const status = req.query.status ?? '';
    const borough = req.query.borough ?? '';
    const limit = Number(req.query.limit ?? 20);
    const offset = Number(req.query.offset ?? 0);

    const validStatuses = [
      'pending',
      'accepted',
      'rejected',
      'withdrawn'
    ];

    if (
      typeof status !== 'string' ||
      typeof borough !== 'string' ||
      (status && !validStatuses.includes(status)) ||
      (borough && !BOROUGH_VALUES.includes(borough)) ||
      !Number.isInteger(limit) ||
      limit < 1 || limit > 100 ||
      !Number.isInteger(offset) || offset < 0
    ) {
      return sendError(res, 422, 'Invalid filters or pagination');
    }

    // Retrieve applications across the entire platform
    let query = auth.admin
      .from('applications')
      .select(
        `
        id,
        status,
        applied_at,
        volunteers(first_name, last_name, email),
        opportunities!inner(
          title,
          borough,
          organizations(name)
        )
        `,
        { count: 'exact' }
      )
      .order('applied_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (borough) {
      query = query.eq('opportunities.borough', borough);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('Applications query:', error);
      return sendError(res, 500, 'Failed to retrieve applications');
    }

    // Format application information
    const applications = (data || []).map(app => {
      const volunteer = app.volunteers;
      const opportunity = app.opportunities;

      return {
        id: app.id,
        volunteerName: volunteer
          ? [volunteer.first_name, volunteer.last_name]
              .filter(Boolean).join(' ')
          : 'Unknown volunteer',
        volunteerEmail: volunteer?.email ?? null,
        opportunityTitle: opportunity?.title ?? 'Unknown',
        organizationName:
          opportunity?.organizations?.name ?? 'Unknown',
        borough: opportunity?.borough ?? null,
        status: app.status,
        appliedAt: app.applied_at,
      };
    });

    return res.status(200).json({
      success: true,
      data: applications,
      total: count ?? 0,
      limit,
      offset,
    });

  } catch (error) {
    console.error('Admin applications error:', error);
    return sendError(res, 500, 'Internal server error');
  }
}
