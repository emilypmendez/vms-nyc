import { authenticateAdmin } from '../../../lib/authenticateAdmin';
import { allowMethods, sendError } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['GET'])) return;

  res.setHeader('Cache-Control', 'private, no-store');

  try {
    // Verify administrator access
    const auth = await authenticateAdmin(req);

    if (auth.error) {
      return sendError(res, auth.statusCode, auth.error);
    }

    const limit = Number(req.query.limit ?? 20);
    const offset = Number(req.query.offset ?? 0);

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100 ||
      !Number.isInteger(offset) ||
      offset < 0
    ) {
      return sendError(res, 422, 'Invalid pagination');
    }

    // Retrieve organizations and opportunity counts
    const { data, count, error } = await auth.admin
      .from('organizations')
      .select(
        'id, name, email, verified, created_at, opportunities(count)',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Organizations query:', error);
      return sendError(res, 500, 'Failed to retrieve organizations');
    }

    // Format the results for the frontend
    const organizations = (data || []).map((org) => ({
      id: org.id,
      name: org.name,
      email: org.email,
      verified: org.verified,
      createdAt: org.created_at,
      opportunitiesCount: org.opportunities?.[0]?.count ?? 0,
    }));

    return res.status(200).json({
      success: true,
      data: organizations,
      total: count ?? 0,
      limit,
      offset,
    });

  } catch (error) {
    console.error('Admin organizations error:', error);
    return sendError(res, 500, 'Internal server error');
  }
}
