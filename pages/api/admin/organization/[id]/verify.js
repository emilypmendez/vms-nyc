import { authenticateAdmin } from '../../../../../lib/authenticateAdmin';
import {
  allowMethods,
  sendError,
  isUuid
} from '../../../../../lib/supabase';

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['PUT'])) return;

  res.setHeader('Cache-Control', 'private, no-store');

  try {
    const auth = await authenticateAdmin(req);

    if (auth.error) {
      return sendError(res, auth.statusCode, auth.error);
    }

    const { id } = req.query;
    const { verified } = req.body || {};

    if (!isUuid(id)) {
      return sendError(res, 422, 'Invalid organization ID');
    }

    if (typeof verified !== 'boolean') {
      return sendError(res, 422, 'Verified must be true or false');
    }

    const { data, error } = await auth.admin
      .from('organizations')
      .update({ verified })
      .eq('id', id)
      .select('id, name, verified')
      .maybeSingle();

    if (error) {
      console.error('Verification error:', error);
      return sendError(res, 500, 'Failed to update verification');
    }

    if (!data) {
      return sendError(res, 404, 'Organization not found');
    }

    return res.status(200).json({
      success: true,
      data,
    });

  } catch (error) {
    console.error('Admin verification error:', error);
    return sendError(res, 500, 'Internal server error');
  }
}
