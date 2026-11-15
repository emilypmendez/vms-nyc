import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { borough, skill, limit = 20, offset = 0 } = req.query;

    let query = supabase
      .from('opportunities')
      .select(
        `
        id,
        title,
        description,
        required_skills,
        commitment,
        borough,
        slots_available,
        status,
        created_at,
        organizations (id, name)
        `,
        { count: 'exact' }
      )
      .eq('status', 'open');

    // Filter by borough
    if (borough) {
      query = query.eq('borough', borough);
    }

    // Filter by skill (array contains)
    if (skill) {
      query = query.contains('required_skills', [skill]);
    }

    // Pagination
    query = query
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    // Format response
    const formatted = data.map((opp) => ({
      id: opp.id,
      title: opp.title,
      description: opp.description,
      requiredSkills: opp.required_skills,
      commitment: opp.commitment,
      borough: opp.borough,
      slotsAvailable: opp.slots_available,
      status: opp.status,
      // organizations is null because RLS keeps organization rows private
      organizationId: opp.organizations?.id ?? null,
      organizationName: opp.organizations?.name ?? null,
      createdAt: opp.created_at,
    }));

    return res.status(200).json({
      success: true,
      data: formatted,
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
