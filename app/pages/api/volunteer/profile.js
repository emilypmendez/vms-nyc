import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('volunteers')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        return res.status(404).json({ success: false, error: 'Profile not found' });
      }

      return res.status(200).json({ success: true, data });
    }

    if (req.method === 'PUT') {
      const { firstName, lastName, skills, borough, availability, bio } = req.body;

      const { data, error } = await supabase
        .from('volunteers')
        .update({
          first_name: firstName,
          last_name: lastName,
          skills,
          borough,
          availability,
          bio,
          updated_at: new Date(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ success: false, error: error.message });
      }

      return res.status(200).json({ success: true, data });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
