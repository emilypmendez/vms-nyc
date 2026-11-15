import { allowMethods, authenticate, isUuid, sendError } from '../../../lib/apiAuth';

// POST /api/opportunity/apply  { opportunityId }
// A volunteer applies to an open opportunity.
export default async function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) return;

  const opportunityId = req.body?.opportunityId;
  if (!isUuid(opportunityId)) {
    return sendError(res, 422, 'Validation failed', {
      opportunityId: 'A valid opportunityId is required',
    });
  }

  try {
    const auth = await authenticate(req, res);
    if (!auth) return;
    const { supabase, user } = auth;

    // Only users with a volunteer profile can apply.
    const { data: volunteer, error: volunteerError } = await supabase
      .from('volunteers')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (volunteerError) return sendError(res, 400, volunteerError.message);
    if (!volunteer) {
      return sendError(res, 403, 'Only volunteers can apply to opportunities');
    }

    const { data: opportunity, error: opportunityError } = await supabase
      .from('opportunities')
      .select('id, status')
      .eq('id', opportunityId)
      .maybeSingle();

    if (opportunityError) return sendError(res, 400, opportunityError.message);
    if (!opportunity) return sendError(res, 404, 'Opportunity not found');
    if (opportunity.status !== 'open') {
      return sendError(res, 409, 'This opportunity is no longer accepting applications');
    }

    const { data, error } = await supabase
      .from('applications')
      .insert({
        volunteer_id: user.id,
        opportunity_id: opportunityId,
        status: 'pending',
      })
      .select('id, status, applied_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        // UNIQUE (volunteer_id, opportunity_id)
        return sendError(res, 409, 'You have already applied to this opportunity');
      }
      return sendError(res, 400, error.message);
    }

    return res.status(201).json({
      success: true,
      data: {
        applicationId: data.id,
        status: data.status,
        appliedAt: data.applied_at,
      },
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}
