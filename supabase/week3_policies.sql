-- Week 3 RLS additions. Run once in the Supabase SQL Editor.
--
-- Why: the policies in 02_SUPABASE_SETUP.md only let an organization read its
-- OWN row. Volunteers browsing opportunities therefore can't see which org
-- posted them: the `organizations (id, name)` join in /api/opportunity/search
-- and /api/opportunity/[id] comes back null.

-- Anyone (including logged-out visitors) can read organization profiles.
-- Organizations still can only UPDATE their own row (organizations_own_profile).
DROP POLICY IF EXISTS "organizations_public_read" ON organizations;
CREATE POLICY "organizations_public_read"
  ON organizations
  FOR SELECT
  USING (true);

-- Users can read their own profile row (role). Without this, the profiles
-- lookup in /api/auth/me always returns null because profiles has RLS enabled
-- but no SELECT policy.
DROP POLICY IF EXISTS "profiles_read_own" ON profiles;
CREATE POLICY "profiles_read_own"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);
