-- Week 4: application flow
-- Run in the Supabase SQL Editor after the tables and policies from
-- docs/02_SUPABASE_SETUP.md (Steps 3 and 4).
--
-- Problem: the base policy "volunteers_own_profile" only lets a volunteer read
-- their own row, so an organization reviewing applications can't see who
-- applied (name, email, skills come back as null).
--
-- Fix: let an organization read the profile of any volunteer who applied to
-- one of its opportunities. Read-only; volunteers still control their own rows.
-- No recursion: the subquery reads applications/opportunities, whose policies
-- never reference volunteers.

DROP POLICY IF EXISTS "organizations_read_applicant_volunteers" ON volunteers;

CREATE POLICY "organizations_read_applicant_volunteers"
  ON volunteers
  FOR SELECT
  USING (
    id IN (
      SELECT a.volunteer_id
      FROM applications a
      JOIN opportunities o ON o.id = a.opportunity_id
      WHERE o.organization_id = auth.uid()
    )
  );
