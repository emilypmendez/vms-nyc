import { authenticateOrganization, sendError } from '../../../lib/supabase';
import { BOROUGHS } from '../../../lib/opportunity';

function formatOrganization(org) {
  return {
    id: org.id,
    name: org.name,
    email: org.email,
    phone: org.phone,
    description: org.description,
    address: org.address,
    borough: org.borough,
    verified: org.verified,
    createdAt: org.created_at,
    updatedAt: org.updated_at,
  };
}

// GET /api/organization/profile  -> current organization's profile
// PUT /api/organization/profile  -> update name, phone, description, address, borough
export default async function handler(req, res) {
  if (!['GET', 'PUT'].includes(req.method)) {
    res.setHeader('Allow', 'GET, PUT');
    return sendError(res, 405, 'Method not allowed');
  }

  try {
    const auth = await authenticateOrganization(req);
    if (auth.error) return sendError(res, auth.statusCode, auth.error);

    if (req.method === 'GET') {
      return res.status(200).json({ success: true, data: formatOrganization(auth.organization) });
    }

    // PUT: only update fields that were sent
    const body = req.body || {};
    const updates = {};
    const errors = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) errors.name = 'Organization name is required';
      else updates.name = name;
    }
    for (const field of ['phone', 'description', 'address']) {
      if (body[field] !== undefined) updates[field] = String(body[field]).trim() || null;
    }
    if (body.borough !== undefined) {
      const borough = body.borough || null;
      if (borough && !BOROUGHS.some((b) => b.value === borough)) {
        errors.borough = 'Invalid borough';
      } else updates.borough = borough;
    }
    // Note: `verified` and `email` are intentionally NOT editable here.

    if (Object.keys(errors).length) return sendError(res, 422, 'Validation failed', errors);
    if (!Object.keys(updates).length) return sendError(res, 422, 'No fields to update');

    updates.updated_at = new Date().toISOString();

    const { data, error } = await auth.supabase
      .from('organizations')
      .update(updates)
      .eq('id', auth.user.id)
      .select()
      .single();

    if (error) return sendError(res, 400, error.message);

    return res.status(200).json({
      success: true,
      data: formatOrganization(data),
      message: 'Profile updated',
    });
  } catch (error) {
    return sendError(res, 500, error.message || 'Internal server error');
  }
}
