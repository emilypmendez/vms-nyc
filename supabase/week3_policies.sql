-- Week 3 RLS additions. Run once in the Supabase SQL Editor.
--
-- Organization rows stay private: only the organization itself can read its
-- own row (organizations_own_profile in 02_SUPABASE_SETUP.md). Volunteers
-- browsing opportunities therefore get `organizations = null` from the join
-- in /api/opportunity/search and /api/opportunity/[id], and the API returns
-- organizationName: null.

-- Users can read their own profile row (role). Without this, the profiles
-- lookup in /api/auth/me always returns null because profiles has RLS enabled
-- but no SELECT policy.
DROP POLICY IF EXISTS "profiles_read_own" ON profiles;
CREATE POLICY "profiles_read_own"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);
