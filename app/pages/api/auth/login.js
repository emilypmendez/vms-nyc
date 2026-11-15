import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(422).json({
      success: false,
      error: 'Email and password required',
    });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ success: false, error: error.message });
    }

    return res.status(200).json({
      success: true,
      data: {
        session: data.session,
        user: data.user,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
