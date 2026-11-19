
import { authenticateAdmin } from '../../../lib/authenticateAdmin';
import { allowMethods, sendError } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (!allowMethods(req, res, ['GET'])) return;

  res.setHeader('Cache-Control', 'private, no-store');

  try {
    const auth = await authenticateAdmin(req);

    if (auth.error) {
      return sendError(res, auth.statusCode, auth.error);
    }

    const role = req.query.role ?? '';
    const validRoles = ['admin', 'volunteer', 'organization'];

    if (typeof role !== 'string' ||
        (role && !validRoles.includes(role))) {
      return sendError(res, 422, 'Invalid role filter');
    }

    const limit = Number(req.query.limit ?? 20);
    const offset = Number(req.query.offset ?? 0);

    if (!Number.isInteger(limit) || limit < 1 || limit > 100 ||
        !Number.isInteger(offset) || offset < 0) {
      return sendError(res, 422, 'Invalid pagination');
    }

    const db = auth.admin;

    let query = db
      .from('profiles')
      .select('id, role', { count: 'exact' })
      .order('id')
      .range(offset, offset + limit - 1);

    if (role) query = query.eq('role', role);

    const { data: profiles, count, error } = await query;

    if (error) throw error;

    const ids = (profiles || []).map(user => user.id);

    if (ids.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        total: count ?? 0,
        limit,
        offset,
      });
    }

    // Get names and emails from role-specific tables
    const [volResult, orgResult, ...authResults] =
      await Promise.all([
        db.from('volunteers')
          .select('id, first_name, last_name, email')
          .in('id', ids),

        db.from('organizations')
          .select('id, name, email')
          .in('id', ids),

        ...ids.map(id => db.auth.admin.getUserById(id)),
      ]);

    if (volResult.error || orgResult.error ||
        authResults.some(result => result.error)) {
      throw new Error('Failed to load user details');
    }

    const volunteers = new Map(
      (volResult.data || []).map(v => [v.id, v])
    );

    const organizations = new Map(
      (orgResult.data || []).map(o => [o.id, o])
    );

    const authUsers = new Map(
      authResults
        .map(result => result.data?.user)
        .filter(Boolean)
        .map(user => [user.id, user])
    );

    const users = profiles.map(profile => {
      const volunteer = volunteers.get(profile.id);
      const organization = organizations.get(profile.id);
      const account = authUsers.get(profile.id);

      return {
        id: profile.id,
        role: profile.role,
        name: volunteer
          ? [volunteer.first_name, volunteer.last_name]
              .filter(Boolean).join(' ')
          : organization?.name || 'Not available',
        email: account?.email ||
          volunteer?.email ||
          organization?.email ||
          'Not available',
        createdAt: account?.created_at || null,
      };
    });

    return res.status(200).json({
      success: true,
      data: users,
      total: count ?? 0,
      limit,
      offset,
    });

  } catch (error) {
    console.error('Admin users error:', error);
    return sendError(res, 500, 'Failed to retrieve users');
  }
}
