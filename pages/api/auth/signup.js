import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin, isAdminConfigured } from '../../../lib/supabaseAdmin';

// Anon client, used only for auth.signUp so Supabase applies its normal signup
// rules (email confirmation, password policy). No session is kept in memory,
// so concurrent requests can't leak into each other.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// Roles a user may pick for themselves. 'admin' is intentionally excluded:
// the profile insert below bypasses RLS, so this list is the only guard.
const SELF_SIGNUP_ROLES = ['volunteer', 'organization'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, role, firstName, lastName, organizationName } = req.body ?? {};

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

  if (!SELF_SIGNUP_ROLES.includes(role)) {
    return res.status(422).json({
      success: false,
      error: 'Invalid role',
      details: { role: `Role must be one of: ${SELF_SIGNUP_ROLES.join(', ')}` },
    });
  }

  if (role === 'organization' && !organizationName) {
    return res.status(422).json({
      success: false,
      error: 'Missing required fields',
      details: { organizationName: 'Organization name is required' },
    });
  }

  // Check before creating the auth user, so a misconfigured server can't leave
  // behind a login with no profile.
  if (!isAdminConfigured()) {
    return res.status(500).json({
      success: false,
      error: 'Server is missing SUPABASE_SERVICE_ROLE_KEY (see .env.local)',
    });
  }

  const admin = getSupabaseAdmin();

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

    // With email confirmation on, Supabase hides "already registered" by
    // returning a user with no identities instead of an error.
    if (!authData.user || authData.user.identities?.length === 0) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists',
      });
    }

    const userId = authData.user.id;

    // Undo the auth user if a later step fails, so the email can be reused.
    const rollback = async () => {
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) console.error(`signup rollback failed for ${userId}:`, error.message);
    };

    // 2. Create profile entry (service role: the new user has no session yet,
    //    so RLS would reject this insert)
    const { error: profileError } = await admin
      .from('profiles')
      .insert({ id: userId, role });

    if (profileError) {
      await rollback();
      return res.status(400).json({ success: false, error: profileError.message });
    }

    // 3. Create role-specific entry
    let roleError = null;
    if (role === 'volunteer') {
      const { error } = await admin.from('volunteers').insert({
        id: userId,
        first_name: firstName,
        last_name: lastName,
        email,
      });
      roleError = error;
    } else if (role === 'organization') {
      const { error } = await admin.from('organizations').insert({
        id: userId,
        name: organizationName,
        email,
      });
      roleError = error;
    }

    if (roleError) {
      // Deleting the auth user cascades to profiles if the FK is ON DELETE
      // CASCADE; delete it explicitly too in case it isn't.
      await admin.from('profiles').delete().eq('id', userId);
      await rollback();
      return res.status(400).json({ success: false, error: roleError.message });
    }

    // Success
    return res.status(201).json({
      success: true,
      data: {
        user: authData.user,
        message: authData.session
          ? 'Signup successful.'
          : 'Signup successful. Check your email to confirm.',
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
