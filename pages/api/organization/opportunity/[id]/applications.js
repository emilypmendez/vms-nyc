import { allowMethods, authenticate, isUuid, sendError } from '../../../../../lib/supabase';

// GET /api/organization/opportunity/:id/applications
// The owning organization lists every application to one of its opportunities,
// with the applicant's details.
export default async function handler(req, res) {
  if (!allowMethods(req, res, ['GET'])) return;

  const { id } = req.query;
  if (!isUuid(id)) return sendError(res, 404, 'Resource not found');

  try {
    const auth = await authenticate(req);
    if (auth.error) return sendError(res, auth.statusCode, auth.error);
    const { supabase, user } = auth;

    const { data: opportunity, error: opportunityError } = await supabase
      .from('opportunities')
      .select('id, organization_id, title, required_skills, slots_available, status')
      .eq('id', id)
      .maybeSingle();

    if (opportunityError) return sendError(res, 400, opportunityError.message);
    if (!opportunity) return sendError(res, 404, 'Resource not found');
    if (opportunity.organization_id !== user.id) {
      return sendError(res, 403, "You don't have permission to access this resource");
    }

    // Reading volunteers here relies on the
    // "organizations_read_applicant_volunteers" policy in
    // supabase/migrations/20261115_application_flow_rls.sql.
    const { data, error } = await supabase
      .from('applications')
      .select(
        `
        id,
        status,
        applied_at,
        reviewed_at,
        notes,
        volunteers (
          id,
          first_name,
          last_name,
          email,
          phone,
          skills,
          borough,
          availability,
          bio
        )
        `
      )
      .eq('opportunity_id', id)
      .order('applied_at', { ascending: false });

    if (error) return sendError(res, 400, error.message);

    const formatted = data.map((app) => {
      const v = app.volunteers;
      return {
        id: app.id,
        volunteerId: v?.id ?? null,
        volunteerName: v ? `${v.first_name} ${v.last_name}`.trim() : 'Unknown volunteer',
        volunteerEmail: v?.email ?? null,
        volunteerPhone: v?.phone ?? null,
        volunteerSkills: v?.skills ?? [],
        volunteerBorough: v?.borough ?? null,
        volunteerAvailability: v?.availability ?? null,
        volunteerBio: v?.bio ?? null,
        status: app.status,
        appliedAt: app.applied_at,
        reviewedAt: app.reviewed_at,
        notes: app.notes,
      };
    });

    return res.status(200).json({
      success: true,
      data: formatted,
      // Extra context for the review UI (skill match, slots left).
      opportunity: {
        id: opportunity.id,
        title: opportunity.title,
        requiredSkills: opportunity.required_skills ?? [],
        slotsAvailable: opportunity.slots_available,
        acceptedCount: formatted.filter((a) => a.status === 'accepted').length,
        status: opportunity.status,
      },
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}
