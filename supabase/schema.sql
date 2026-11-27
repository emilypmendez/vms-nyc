-- VMS-NYC PUBLIC DATABASE SCHEMA

-- Source: Supabase declarative export

-- Schema-only snapshot; no application row data.

-- Review before using for database restoration.

-- ===== SCHEMA =====
COMMENT ON SCHEMA "public" IS 'standard public schema';

REVOKE ALL ON SCHEMA "public" FROM PUBLIC;

GRANT USAGE ON SCHEMA "public" TO PUBLIC;

REVOKE ALL ON SCHEMA "public" FROM "anon";

GRANT USAGE ON SCHEMA "public" TO "anon";

REVOKE ALL ON SCHEMA "public" FROM "authenticated";

GRANT USAGE ON SCHEMA "public" TO "authenticated";

REVOKE ALL ON SCHEMA "public" FROM "pg_database_owner";

GRANT CREATE, USAGE ON SCHEMA "public" TO "pg_database_owner";

REVOKE ALL ON SCHEMA "public" FROM "postgres";

GRANT USAGE ON SCHEMA "public" TO "postgres";

REVOKE ALL ON SCHEMA "public" FROM "service_role";

GRANT USAGE ON SCHEMA "public" TO "service_role";

-- ===== EXTENSION: pgcrypto =====
CREATE EXTENSION "pgcrypto" SCHEMA "extensions";

COMMENT ON EXTENSION "pgcrypto" IS 'cryptographic functions';

-- ===== EXTENSION: uuid-ossp =====
CREATE EXTENSION "uuid-ossp" SCHEMA "extensions";

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';

-- ===== TABLE DEFINITIONS =====
CREATE TABLE "public"."profiles" (
  "id"         uuid                        NOT NULL,
  "role"       text                        DEFAULT 'volunteer'::text,
  "created_at" timestamp without time zone DEFAULT now(),
  "updated_at" timestamp without time zone DEFAULT now(),
  CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT "profiles_pkey" PRIMARY KEY (id),
  CONSTRAINT "profiles_role_check" CHECK ((role = ANY (ARRAY['volunteer'::text, 'organization'::text, 'admin'::text])))
);

CREATE TABLE "public"."organizations" (
  "id"          uuid                        NOT NULL,
  "name"        text                        NOT NULL,
  "email"       text                        NOT NULL,
  "phone"       text,
  "description" text,
  "address"     text,
  "borough"     text,
  "verified"    boolean                     DEFAULT false,
  "created_at"  timestamp without time zone DEFAULT now(),
  "updated_at"  timestamp without time zone DEFAULT now(),
  CONSTRAINT "organizations_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT "organizations_pkey" PRIMARY KEY (id)
);

CREATE TABLE "public"."volunteers" (
  "id"           uuid                        NOT NULL,
  "first_name"   text                        NOT NULL,
  "last_name"    text                        NOT NULL,
  "email"        text                        NOT NULL,
  "phone"        text,
  "bio"          text,
  "skills"       text[]                      DEFAULT '{}'::text[],
  "availability" text,
  "borough"      text,
  "created_at"   timestamp without time zone DEFAULT now(),
  "updated_at"   timestamp without time zone DEFAULT now(),
  CONSTRAINT "volunteers_borough_check" CHECK ((borough = ANY (ARRAY['manhattan'::text, 'brooklyn'::text, 'queens'::text, 'bronx'::text, 'staten_island'::text]))),
  CONSTRAINT "volunteers_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT "volunteers_pkey" PRIMARY KEY (id)
);

CREATE TABLE "public"."opportunities" (
  "id"              uuid                        NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" uuid                        NOT NULL,
  "title"           text                        NOT NULL,
  "description"     text                        NOT NULL,
  "required_skills" text[]                      DEFAULT '{}'::text[],
  "commitment"      text                        DEFAULT 'one-time'::text,
  "start_date"      date,
  "end_date"        date,
  "slots_available" integer                     DEFAULT 1,
  "location"        text,
  "borough"         text,
  "status"          text                        DEFAULT 'open'::text,
  "created_at"      timestamp without time zone DEFAULT now(),
  "updated_at"      timestamp without time zone DEFAULT now(),
  CONSTRAINT "opportunities_borough_check" CHECK ((borough = ANY (ARRAY['manhattan'::text, 'brooklyn'::text, 'queens'::text, 'bronx'::text, 'staten_island'::text]))),
  CONSTRAINT "opportunities_commitment_check" CHECK ((commitment = ANY (ARRAY['one-time'::text, 'weekly'::text, 'monthly'::text]))),
  CONSTRAINT "opportunities_pkey" PRIMARY KEY (id),
  CONSTRAINT "opportunities_status_check" CHECK ((status = ANY (ARRAY['open'::text, 'filled'::text, 'closed'::text]))),
  CONSTRAINT "opportunities_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE
);

CREATE TABLE "public"."applications" (
  "id"             uuid                        NOT NULL DEFAULT gen_random_uuid(),
  "volunteer_id"   uuid                        NOT NULL,
  "opportunity_id" uuid                        NOT NULL,
  "status"         text                        DEFAULT 'pending'::text,
  "applied_at"     timestamp without time zone DEFAULT now(),
  "reviewed_at"    timestamp without time zone,
  "reviewed_by"    uuid,
  "notes"          text,
  CONSTRAINT "applications_pkey" PRIMARY KEY (id),
  CONSTRAINT "applications_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text, 'withdrawn'::text]))),
  CONSTRAINT "applications_volunteer_id_opportunity_id_key" UNIQUE (volunteer_id, opportunity_id),
  CONSTRAINT "applications_opportunity_id_fkey" FOREIGN KEY (opportunity_id) REFERENCES public.opportunities(id) ON DELETE CASCADE,
  CONSTRAINT "applications_reviewed_by_fkey" FOREIGN KEY (reviewed_by) REFERENCES public.organizations(id),
  CONSTRAINT "applications_volunteer_id_fkey" FOREIGN KEY (volunteer_id) REFERENCES public.volunteers(id) ON DELETE CASCADE
);

CREATE TABLE "public"."volunteer_history" (
  "id"              uuid                        NOT NULL DEFAULT gen_random_uuid(),
  "volunteer_id"    uuid                        NOT NULL,
  "opportunity_id"  uuid                        NOT NULL,
  "hours_completed" numeric(5,2),
  "date_completed"  date,
  "notes"           text,
  "created_at"      timestamp without time zone DEFAULT now(),
  CONSTRAINT "volunteer_history_opportunity_id_fkey" FOREIGN KEY (opportunity_id) REFERENCES public.opportunities(id),
  CONSTRAINT "volunteer_history_pkey" PRIMARY KEY (id),
  CONSTRAINT "volunteer_history_volunteer_id_fkey" FOREIGN KEY (volunteer_id) REFERENCES public.volunteers(id) ON DELETE CASCADE
);

-- ===== FUNCTION: vms_has_role =====
CREATE OR REPLACE FUNCTION public.vms_has_role (
  wanted_role text
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = wanted_role
  );
$function$;

GRANT EXECUTE ON FUNCTION "public"."vms_has_role"(text) TO "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."vms_has_role"(text) TO "service_role";

REVOKE ALL ON FUNCTION "public"."vms_has_role"(text) FROM PUBLIC;

REVOKE ALL ON FUNCTION "public"."vms_has_role"(text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."vms_has_role"(text) TO "postgres";

-- ===== FUNCTION: vms_set_organization_verified =====
CREATE OR REPLACE FUNCTION public.vms_set_organization_verified (
  p_organization_id uuid,
  p_verified        boolean
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
BEGIN
  IF NOT public.vms_has_role('admin') THEN
    RAISE EXCEPTION 'Admin access required'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.organizations
  SET verified = p_verified,
      updated_at = NOW()
  WHERE id = p_organization_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Organization not found';
  END IF;
END;
$function$;

GRANT EXECUTE ON FUNCTION "public"."vms_set_organization_verified"(uuid, boolean) TO "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."vms_set_organization_verified"(uuid, boolean) TO "service_role";

REVOKE ALL ON FUNCTION "public"."vms_set_organization_verified"(uuid, boolean) FROM PUBLIC;

REVOKE ALL ON FUNCTION "public"."vms_set_organization_verified"(uuid, boolean) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."vms_set_organization_verified"(uuid, boolean) TO "postgres";

-- ===== RLS POLICIES AND GRANTS =====
ALTER TABLE "public"."profiles"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_read_own" ON "public"."profiles"
  FOR SELECT
  TO PUBLIC
  USING ((auth.uid() = id));

CREATE POLICY "vms_profiles_read" ON "public"."profiles"
  FOR SELECT
  TO "authenticated"
  USING (((id = auth.uid()) OR public.vms_has_role('admin'::text)));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "service_role";

REVOKE ALL ON TABLE "public"."profiles" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "postgres";

ALTER TABLE "public"."organizations"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX organizations_borough ON public.organizations USING btree (borough);

CREATE POLICY "vms_organizations_insert" ON "public"."organizations"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((id = auth.uid()) AND public.vms_has_role('organization'::text) AND (verified = false)));

CREATE POLICY "vms_organizations_member_read" ON "public"."organizations"
  FOR SELECT
  TO "authenticated"
  USING ((((id = auth.uid()) AND public.vms_has_role('organization'::text)) OR public.vms_has_role('admin'::text)));

CREATE POLICY "vms_organizations_update" ON "public"."organizations"
  FOR UPDATE
  TO "authenticated"
  USING (((id = auth.uid()) AND public.vms_has_role('organization'::text)))
  WITH CHECK (((id = auth.uid()) AND public.vms_has_role('organization'::text)));

REVOKE ALL ON TABLE "public"."organizations" FROM "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."organizations" TO "service_role";

REVOKE ALL ON TABLE "public"."organizations" FROM "anon";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."organizations" TO "anon";

REVOKE ALL ("address") ON TABLE "public"."organizations" FROM "authenticated";

GRANT UPDATE ("address") ON TABLE "public"."organizations" TO "authenticated";

REVOKE ALL ("borough") ON TABLE "public"."organizations" FROM "authenticated";

GRANT UPDATE ("borough") ON TABLE "public"."organizations" TO "authenticated";

REVOKE ALL ("description") ON TABLE "public"."organizations" FROM "authenticated";

GRANT UPDATE ("description") ON TABLE "public"."organizations" TO "authenticated";

REVOKE ALL ("email") ON TABLE "public"."organizations" FROM "authenticated";

GRANT UPDATE ("email") ON TABLE "public"."organizations" TO "authenticated";

REVOKE ALL ("name") ON TABLE "public"."organizations" FROM "authenticated";

GRANT UPDATE ("name") ON TABLE "public"."organizations" TO "authenticated";

REVOKE ALL ("phone") ON TABLE "public"."organizations" FROM "authenticated";

GRANT UPDATE ("phone") ON TABLE "public"."organizations" TO "authenticated";

REVOKE ALL ("updated_at") ON TABLE "public"."organizations" FROM "authenticated";

GRANT UPDATE ("updated_at") ON TABLE "public"."organizations" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."organizations" TO "authenticated";

REVOKE ALL ON TABLE "public"."organizations" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."organizations" TO "postgres";

ALTER TABLE "public"."volunteers"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX volunteers_borough ON public.volunteers USING btree (borough);

CREATE POLICY "vms_volunteers_insert" ON "public"."volunteers"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((id = auth.uid()) AND public.vms_has_role('volunteer'::text)));

CREATE POLICY "vms_volunteers_read" ON "public"."volunteers"
  FOR SELECT
  TO "authenticated"
  USING (((id = auth.uid()) OR public.vms_has_role('admin'::text) OR (EXISTS ( SELECT 1
   FROM (public.applications a
     JOIN public.opportunities o ON ((o.id = a.opportunity_id)))
  WHERE ((a.volunteer_id = volunteers.id) AND (o.organization_id = auth.uid()) AND public.vms_has_role('organization'::text))))));

CREATE POLICY "vms_volunteers_update" ON "public"."volunteers"
  FOR UPDATE
  TO "authenticated"
  USING (((id = auth.uid()) AND public.vms_has_role('volunteer'::text)))
  WITH CHECK (((id = auth.uid()) AND public.vms_has_role('volunteer'::text)));

REVOKE ALL ON TABLE "public"."volunteers" FROM "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."volunteers" TO "service_role";

REVOKE ALL ON TABLE "public"."volunteers" FROM "anon";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."volunteers" TO "anon";

REVOKE ALL ("availability") ON TABLE "public"."volunteers" FROM "authenticated";

GRANT UPDATE ("availability") ON TABLE "public"."volunteers" TO "authenticated";

REVOKE ALL ("bio") ON TABLE "public"."volunteers" FROM "authenticated";

GRANT UPDATE ("bio") ON TABLE "public"."volunteers" TO "authenticated";

REVOKE ALL ("borough") ON TABLE "public"."volunteers" FROM "authenticated";

GRANT UPDATE ("borough") ON TABLE "public"."volunteers" TO "authenticated";

REVOKE ALL ("email") ON TABLE "public"."volunteers" FROM "authenticated";

GRANT UPDATE ("email") ON TABLE "public"."volunteers" TO "authenticated";

REVOKE ALL ("first_name") ON TABLE "public"."volunteers" FROM "authenticated";

GRANT UPDATE ("first_name") ON TABLE "public"."volunteers" TO "authenticated";

REVOKE ALL ("last_name") ON TABLE "public"."volunteers" FROM "authenticated";

GRANT UPDATE ("last_name") ON TABLE "public"."volunteers" TO "authenticated";

REVOKE ALL ("phone") ON TABLE "public"."volunteers" FROM "authenticated";

GRANT UPDATE ("phone") ON TABLE "public"."volunteers" TO "authenticated";

REVOKE ALL ("skills") ON TABLE "public"."volunteers" FROM "authenticated";

GRANT UPDATE ("skills") ON TABLE "public"."volunteers" TO "authenticated";

REVOKE ALL ("updated_at") ON TABLE "public"."volunteers" FROM "authenticated";

GRANT UPDATE ("updated_at") ON TABLE "public"."volunteers" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."volunteers" TO "authenticated";

REVOKE ALL ON TABLE "public"."volunteers" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."volunteers" TO "postgres";

ALTER TABLE "public"."opportunities"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX opportunities_borough_status ON public.opportunities USING btree (borough, status);

CREATE INDEX opportunities_organization_id ON public.opportunities USING btree (organization_id);

CREATE POLICY "vms_opportunities_insert" ON "public"."opportunities"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((organization_id = auth.uid()) AND public.vms_has_role('organization'::text)));

CREATE POLICY "vms_opportunities_owner_admin_read" ON "public"."opportunities"
  FOR SELECT
  TO "authenticated"
  USING ((((organization_id = auth.uid()) AND public.vms_has_role('organization'::text)) OR public.vms_has_role('admin'::text)));

CREATE POLICY "vms_opportunities_public_read" ON "public"."opportunities"
  FOR SELECT
  TO "anon", "authenticated"
  USING ((status = 'open'::text));

CREATE POLICY "vms_opportunities_update" ON "public"."opportunities"
  FOR UPDATE
  TO "authenticated"
  USING (((organization_id = auth.uid()) AND public.vms_has_role('organization'::text)))
  WITH CHECK (((organization_id = auth.uid()) AND public.vms_has_role('organization'::text)));

REVOKE ALL ON TABLE "public"."opportunities" FROM "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."opportunities" TO "service_role";

REVOKE ALL ON TABLE "public"."opportunities" FROM "anon";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."opportunities" TO "anon";

REVOKE ALL ("borough") ON TABLE "public"."opportunities" FROM "authenticated";

GRANT UPDATE ("borough") ON TABLE "public"."opportunities" TO "authenticated";

REVOKE ALL ("commitment") ON TABLE "public"."opportunities" FROM "authenticated";

GRANT UPDATE ("commitment") ON TABLE "public"."opportunities" TO "authenticated";

REVOKE ALL ("description") ON TABLE "public"."opportunities" FROM "authenticated";

GRANT UPDATE ("description") ON TABLE "public"."opportunities" TO "authenticated";

REVOKE ALL ("end_date") ON TABLE "public"."opportunities" FROM "authenticated";

GRANT UPDATE ("end_date") ON TABLE "public"."opportunities" TO "authenticated";

REVOKE ALL ("location") ON TABLE "public"."opportunities" FROM "authenticated";

GRANT UPDATE ("location") ON TABLE "public"."opportunities" TO "authenticated";

REVOKE ALL ("required_skills") ON TABLE "public"."opportunities" FROM "authenticated";

GRANT UPDATE ("required_skills") ON TABLE "public"."opportunities" TO "authenticated";

REVOKE ALL ("slots_available") ON TABLE "public"."opportunities" FROM "authenticated";

GRANT UPDATE ("slots_available") ON TABLE "public"."opportunities" TO "authenticated";

REVOKE ALL ("start_date") ON TABLE "public"."opportunities" FROM "authenticated";

GRANT UPDATE ("start_date") ON TABLE "public"."opportunities" TO "authenticated";

REVOKE ALL ("status") ON TABLE "public"."opportunities" FROM "authenticated";

GRANT UPDATE ("status") ON TABLE "public"."opportunities" TO "authenticated";

REVOKE ALL ("title") ON TABLE "public"."opportunities" FROM "authenticated";

GRANT UPDATE ("title") ON TABLE "public"."opportunities" TO "authenticated";

REVOKE ALL ("updated_at") ON TABLE "public"."opportunities" FROM "authenticated";

GRANT UPDATE ("updated_at") ON TABLE "public"."opportunities" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."opportunities" TO "authenticated";

REVOKE ALL ON TABLE "public"."opportunities" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."opportunities" TO "postgres";

ALTER TABLE "public"."applications"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX applications_opportunity_id ON public.applications USING btree (opportunity_id);

CREATE INDEX applications_status ON public.applications USING btree (status);

CREATE INDEX applications_volunteer_id ON public.applications USING btree (volunteer_id);

CREATE POLICY "vms_applications_insert" ON "public"."applications"
  FOR INSERT
  TO "authenticated"
  WITH
    CHECK
    (((volunteer_id = auth.uid()) AND public.vms_has_role('volunteer'::text) AND (status = 'pending'::text) AND (reviewed_at IS NULL) AND (reviewed_by IS NULL) AND (notes IS NULL)
    AND (EXISTS ( SELECT 1
   FROM public.opportunities o
  WHERE ((o.id = applications.opportunity_id) AND (o.status = 'open'::text))))));

CREATE POLICY "vms_applications_read" ON "public"."applications"
  FOR SELECT
  TO "authenticated"
  USING (((volunteer_id = auth.uid()) OR public.vms_has_role('admin'::text) OR (public.vms_has_role('organization'::text) AND (EXISTS ( SELECT 1
   FROM public.opportunities o
  WHERE ((o.id = applications.opportunity_id) AND (o.organization_id = auth.uid())))))));

CREATE POLICY "vms_applications_review" ON "public"."applications"
  FOR UPDATE
  TO "authenticated"
  USING ((public.vms_has_role('organization'::text) AND (EXISTS ( SELECT 1
   FROM public.opportunities o
  WHERE ((o.id = applications.opportunity_id) AND (o.organization_id = auth.uid()))))))
  WITH CHECK ((public.vms_has_role('organization'::text) AND (status = ANY (ARRAY['accepted'::text, 'rejected'::text])) AND (reviewed_by = auth.uid()) AND (reviewed_at IS
    NOT NULL) AND (EXISTS ( SELECT 1
   FROM public.opportunities o
  WHERE ((o.id = applications.opportunity_id) AND (o.organization_id = auth.uid()))))));

REVOKE ALL ON TABLE "public"."applications" FROM "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."applications" TO "service_role";

REVOKE ALL ON TABLE "public"."applications" FROM "anon";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."applications" TO "anon";

REVOKE ALL ("notes") ON TABLE "public"."applications" FROM "authenticated";

GRANT UPDATE ("notes") ON TABLE "public"."applications" TO "authenticated";

REVOKE ALL ("reviewed_at") ON TABLE "public"."applications" FROM "authenticated";

GRANT UPDATE ("reviewed_at") ON TABLE "public"."applications" TO "authenticated";

REVOKE ALL ("reviewed_by") ON TABLE "public"."applications" FROM "authenticated";

GRANT UPDATE ("reviewed_by") ON TABLE "public"."applications" TO "authenticated";

REVOKE ALL ("status") ON TABLE "public"."applications" FROM "authenticated";

GRANT UPDATE ("status") ON TABLE "public"."applications" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."applications" TO "authenticated";

REVOKE ALL ON TABLE "public"."applications" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."applications" TO "postgres";

ALTER TABLE "public"."volunteer_history"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vms_history_read" ON "public"."volunteer_history"
  FOR SELECT
  TO "authenticated"
  USING (((volunteer_id = auth.uid()) OR public.vms_has_role('admin'::text)));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."volunteer_history" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."volunteer_history" TO "service_role";

REVOKE ALL ON TABLE "public"."volunteer_history" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."volunteer_history" TO "postgres";

-- ===== DEFAULT PRIVILEGES =====
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT, UPDATE, USAGE ON SEQUENCES TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT, UPDATE, USAGE ON SEQUENCES TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT, UPDATE, USAGE ON SEQUENCES TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM PUBLIC;

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT EXECUTE ON FUNCTIONS TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT EXECUTE ON FUNCTIONS TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT EXECUTE ON FUNCTIONS TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLES TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLES TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLES TO "service_role";

-- ===== PRIVILEGE OVERRIDES =====
-- Clears assumed destination defaults before creating objects.
-- Safe to load on a project that does not have those defaults.

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "service_role";
