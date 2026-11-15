import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, role, firstName, lastName, organizationName } = req.body;

  // Validate input
  if (!email || !password || !role || !firstName || !lastName) {
    return res.status(422).json({
      success: false,
      error: 'Missing required fields',
      details: {
        email: !email ? 'Email is required' : undefined,
        password: !password ? 'Password is required' : undefined,
        role: !role ? 'Role is required' : undefined,
        firstName: !firstName ? 'First name is required' : undefined,
        lastName: !lastName ? 'Last name is required' : undefined,
      },
    });
  }

  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role }, // Store role in auth user metadata
      },
    });

    if (authError) {
      return res.status(400).json({ success: false, error: authError.message });
    }

    const userId = authData.user.id;

    // 2. Create profile entry
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({ id: userId, role });

    if (profileError) {
      // Cleanup: delete auth user if profile creation fails
      await supabase.auth.admin.deleteUser(userId);
      return res.status(400).json({ success: false, error: profileError.message });
    }

    // 3. Create role-specific entry
    let roleError = null;
    if (role === 'volunteer') {
      const { error } = await supabase.from('volunteers').insert({
        id: userId,
        first_name: firstName,
        last_name: lastName,
        email,
      });
      roleError = error;
    } else if (role === 'organization') {
      const { error } = await supabase.from('organizations').insert({
        id: userId,
        name: organizationName,
        email,
      });
      roleError = error;
    }

    if (roleError) {
      await supabase.auth.admin.deleteUser(userId);
      return res.status(400).json({ success: false, error: roleError.message });
    }

    // Success
    return res.status(201).json({
      success: true,
      data: {
        user: authData.user,
        message: 'Signup successful. Check your email to confirm.',
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}