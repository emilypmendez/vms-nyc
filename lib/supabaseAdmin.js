import { createClient } from '@supabase/supabase-js';

// SERVER-ONLY Supabase client using the service role key.
//
// The service role key bypasses Row Level Security entirely. Only import this
// from API routes (pages/api/**), never from components or pages, and only for
// work that legitimately can't run as the signed-in user (e.g. creating the
// profile rows during signup, before the user has a session).
//
// The env var deliberately has no NEXT_PUBLIC_ prefix so Next.js never ships
// it to the browser.

let adminClient = null;

export function isAdminConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseAdmin() {
  if (typeof window !== 'undefined') {
    throw new Error('getSupabaseAdmin() must only be called on the server');
  }
  if (!isAdminConfigured()) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_URL) in .env.local');
  }

  if (!adminClient) {
    adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  }
  return adminClient;
}
