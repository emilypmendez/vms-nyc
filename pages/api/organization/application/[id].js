import { allowMethods, authenticate, isUuid, sendError } from '../../../../lib/supabase';

const REVIEW_STATUSES = ['accepted', 'rejected'];
const NOTES_MAX = 1000;

function validateReview(body = {}) {
  const errors = {};
  const { status, notes } = body;

  if (!REVIEW_STATUSES.includes(status)) {
    errors.status = `Status must be one of: ${REVIEW_STATUSES.join(', ')}`;
  }

  let cleanNotes = null;
  if (notes !== undefined && notes !== null) {
    if (typeof notes !== 'string') {
      errors.notes = 'Notes must be text';
    } else if (notes.length > NOTES_MAX) {
      errors.notes = `Notes must be ${NOTES_MAX} characters or fewer`;
    } else {
      cleanNotes = notes.trim() || null;
    }
  }

  if (Object.keys(errors).length) return { errors, values: null };
  return { errors: null, values: { status, notes: cleanNotes } };
}

// PUT /api/organization/application/:id  { status: 'accepted' | 'rejected', notes? }
// The owning organization accepts or rejects an application.
export default async function handler(req, res) {
  if (!allowMethods(req, res, ['PUT'])) return;

  const { id } = req.query;
  if (!isUuid(id)) return sendError(res, 404, 'Resource not found');

  const { errors, values } = validateReview(req.body);
  if (errors) return sendError(res, 422, 'Validation failed', errors);

  try {
    const auth = await authenticate(req);
    if (auth.error) return sendError(res, auth.statusCode, auth.error);
    const { supabase, user } = auth;

    // RLS only returns applications to this org's opportunities; the explicit
    // owner check below keeps the API correct even if policies change.
    const { data: application, error: fetchError } = await supabase
      .from('applications')
      .select('id, status, opportunity_id, opportunities (id, organization_id, slots_available)')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) return sendError(res, 400, fetchError.message);
    if (!application || application.opportunities?.organization_id !== user.id) {
      return sendError(res, 404, 'Resource not found');
    }

    if (application.status === 'withdrawn') {
      return sendError(res, 409, 'This application was withdrawn by the volunteer');
    }

    // Don't accept more volunteers than the opportunity has slots for.
    if (values.status === 'accepted' && application.status !== 'accepted') {
      const { count, error: countError } = await supabase
        .from('applications')
        .select('id', { count: 'exact', head: true })
        .eq('opportunity_id', application.opportunity_id)
        .eq('status', 'accepted');

      if (countError) return sendError(res, 400, countError.message);

      const slots = application.opportunities.slots_available;
      if (slots != null && count >= slots) {
        return sendError(res, 409, `All ${slots} slot(s) for this opportunity are already filled`);
      }
    }

    const { data, error } = await supabase
      .from('applications')
      .update({
        status: values.status,
        notes: values.notes,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq('id', id)
      .select('id, status, notes, reviewed_at')
      .maybeSingle();

    if (error) return sendError(res, 400, error.message);
    if (!data) return sendError(res, 404, 'Resource not found');

    return res.status(200).json({
      success: true,
      data: {
        id: data.id,
        status: data.status,
        notes: data.notes,
        reviewedAt: data.reviewed_at,
      },
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}
