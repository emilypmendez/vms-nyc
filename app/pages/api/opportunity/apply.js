import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    const { opportunityId } = req.body;

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
