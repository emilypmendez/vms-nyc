
import { authenticateAdmin } from '../../../lib/authenticateAdmin';
import { allowMethods, sendError } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['GET'])) return;

  try {
    const auth = await authenticateAdmin(req);

    if (auth.error) {
      return sendError(res, auth.statusCode, auth.error);
    }

    const db = auth.admin;

    // Retrieve system-wide statistics
    const [users, organizations, opportunities, applications] =
      await Promise.all([
        db.from('profiles')
          .select('id', { count: 'exact', head: true }),

        db.from('organizations')
          .select('id', { count: 'exact', head: true }),

        db.from('opportunities')
          .select('id', { count: 'exact', head: true }),

        db.from('applications')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
      ]);

    const results = [
      users,
      organizations,
      opportunities,
      applications,
    ];

    if (results.some(result => result.error)) {
      return sendError(res, 500, 'Failed to load dashboard statistics');
    }

    return res.status(200).json({
      success: true,
      data: {
        totalUsers: users.count,
        totalOrganizations: organizations.count,
        totalOpportunities: opportunities.count,
        pendingApplications: applications.count,
      },
    });

  } catch (error) {
    console.error('Admin Dashboard Error:', error);
    return sendError(res, 500, 'Internal server error');
  }
}
