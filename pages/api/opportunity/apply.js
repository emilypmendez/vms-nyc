import { authenticate } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // `supabase` runs as the volunteer (their JWT), so RLS sees auth.uid().
    // The old shared anon client made every insert anonymous, and RLS
    // rejected all applications.
    const auth = await authenticate(req);
    if (auth.error) {
      return res.status(auth.statusCode).json({ success: false, error: auth.error });
    }
    const { user, supabase } = auth;

    const { opportunityId } = req.body ?? {};

    if (!opportunityId) {
      return res.status(422).json({
        success: false,
        error: 'opportunityId is required',
      });
    }

    // Insert application (UNIQUE constraint prevents duplicates)
    const { data, error } = await supabase
      .from('applications')
      .insert({
        volunteer_id: user.id,
        opportunity_id: opportunityId,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation
        return res.status(409).json({
          success: false,
          error: 'You have already applied to this opportunity',
        });
      }
      if (error.code === '42501') {
        // RLS rejected the insert: the caller isn't a volunteer.
        return res.status(403).json({
          success: false,
          error: 'Only volunteers can apply to opportunities',
        });
      }
      return res.status(400).json({ success: false, error: error.message });
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
    return res.status(500).json({ success: false, error: error.message });
  }
}
