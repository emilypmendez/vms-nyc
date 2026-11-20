import { authenticateAdmin } from '../../../lib/authenticateAdmin';
import { allowMethods, sendError } from '../../../lib/supabase';
import { BOROUGHS } from '../../../lib/volunteerOptions';

const APPLICATION_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['GET'])) return;

  res.setHeader('Cache-Control', 'private, no-store');

  try {
    const auth = await authenticateAdmin(req);

    if (auth.error) {
      return sendError(res, auth.statusCode, auth.error);
    }

    const db = auth.admin;

    // Count opportunities in each NYC borough
    const boroughResults = await Promise.all(
      BOROUGHS.map(async (borough) => {
        const { count, error } = await db
          .from('opportunities')
          .select('id', { count: 'exact', head: true })
          .eq('borough', borough.value);

        if (error) throw error;

        return {
          label: borough.label,
          count: count ?? 0,
        };
      })
    );

    // Include opportunities with no borough selected
    const { count: unassigned, error: unassignedError } =
      await db
        .from('opportunities')
        .select('id', { count: 'exact', head: true })
        .is('borough', null);

    if (unassignedError) throw unassignedError;

    if (unassigned > 0) {
      boroughResults.push({
        label: 'Not specified',
        count: unassigned,
      });
    }

    // Count applications by status
    const statusResults = await Promise.all(
      APPLICATION_STATUSES.map(async (status) => {
        const { count, error } = await db
          .from('applications')
          .select('id', { count: 'exact', head: true })
          .eq('status', status.value);

        if (error) throw error;

        return {
          label: status.label,
          count: count ?? 0,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        opportunitiesByBorough: boroughResults,
        applicationsByStatus: statusResults,
      },
    });

  } catch (error) {
    console.error('Admin charts error:', error);
    return sendError(res, 500, 'Failed to load chart data');
  }
}
