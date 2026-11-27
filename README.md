# VMS NYC: Volunteer Management System

A web app that connects New York City volunteers with organizations that need help. Volunteers browse and apply to opportunities; organizations post opportunities and accept or reject applicants.

Built with **Next.js 16 (Pages Router)**, **React 19**, **Tailwind CSS 4** and **Supabase** (Postgres, Auth and Row Level Security).

- [How the app works](#how-the-app-works)
- [Pages](#pages)
- [API reference](#api-reference)
- [Getting started](#getting-started)
- [Database](#database)
- [Project structure](#project-structure)
- [Conventions](#conventions)
- [Not built yet](#not-built-yet)
- [Troubleshooting](#troubleshooting)

---

## How the app works

There are four kinds of users. Everyone sees the same light theme, whatever their computer's light/dark setting.

### Visitors (not logged in)

1. **Home (`/`)**: links to browse opportunities, sign up or log in.
2. **Browse (`/volunteer/browse`)**: every open opportunity, filterable by **borough** and **skill**, 12 per page. Filters are kept in the URL (`?borough=bronx&skill=teaching`), so a search can be shared.
3. **Opportunity detail (`/volunteer/opportunity/:id`)**: description, commitment, slots, borough, location, dates and required skills. Clicking **Apply** sends the visitor to log in, then back to the same opportunity.
4. **Sign up (`/auth/signup`)**: choose **Volunteer** or **Organization**. Organizations also enter an organization name. If the Supabase project doesn't require email confirmation, the new user is logged in and taken straight to their dashboard.

### Volunteers

1. **Log in (`/auth/login`)**: lands on the volunteer dashboard, or on the page they came from (`?next=`).
2. **Dashboard (`/volunteer/dashboard`)**: profile summary (with a prompt to complete it) and **My applications**, with the status of each: pending, accepted or rejected.
3. **Profile (`/volunteer/profile`)**: name, borough, skills (picked from a fixed list), availability and bio.
4. **Apply**: on an opportunity's detail page, **Apply to Opportunity** submits an application. The volunteer sees a confirmation, then goes to their dashboard. Applying twice to the same opportunity is blocked.

### Organizations

1. **Dashboard (`/organization/dashboard`)**: organization name, a verification badge ("Verified" or "Pending verification"), and a table of the organization's opportunities with status, commitment, borough, slots and number of applications.
2. **Create (`/organization/opportunity/new`)**: title, description, required skills (the same list volunteers pick from), commitment (one-time, weekly or monthly), volunteers needed, start and end dates, borough and location. New opportunities are **open**.
3. **Edit and review (`/organization/opportunity/:id`)**:
   - Edit any field, and set the status to **open**, **filled** or **closed**. Only open opportunities appear in Browse.
   - **Applications**: everyone who applied, with name, email, skills, status and date. **Review** opens a panel showing the volunteer's details, how many required skills they match, slots left, and optional **internal notes** (seen only by the organization). **Accept** or **Reject** updates the status straight away. Accepting stops once every slot is filled.

### Admins

Admin accounts can't be created through sign-up; see [Making an admin](#5-making-an-admin).

1. **Log in**: admins land on the admin dashboard.
2. **Dashboard (`/admin/dashboard`)**: totals for users, organizations, opportunities and pending applications; bar charts of opportunities by borough and applications by status; links to the four management pages.
3. **Users (`/admin/users`)**: every account with name, email, role and join date, filterable by role.
4. **Organizations (`/admin/organizations`)**: every organization with its opportunity count and verification status. **Verify** or **Unverify** (after a confirmation) changes the badge the organization sees on its dashboard.
5. **Opportunities (`/admin/opportunities`)**: every opportunity on the platform (any status), filterable by borough and status, with application counts.
6. **Applications (`/admin/applications`)**: every application, with volunteer, opportunity, organization, borough, status and date, filterable by status and borough.

### Privacy rules (enforced in the database)

- Organization records are **private**: only the organization (and admins) can read them. Volunteers see an opportunity's details but not which organization posted it.
- A volunteer's profile is visible to the volunteer, and to organizations they have **applied to**.
- An organization can only see and review applications to **its own** opportunities.

---

## Pages

| Path | Who | What it does |
|---|---|---|
| `/` | Everyone | Home page; logged-in users get a "Go to your dashboard" link |
| `/auth/signup` | Visitors | Create a volunteer or organization account |
| `/auth/login` | Visitors | Log in; supports `?next=/path` and `?email=` |
| `/volunteer/browse` | Everyone | Search open opportunities by borough and skill |
| `/volunteer/opportunity/[id]` | Everyone | Opportunity details and Apply button |
| `/volunteer/dashboard` | Volunteers | Profile summary and application statuses |
| `/volunteer/profile` | Volunteers | Edit volunteer profile |
| `/organization/dashboard` | Organizations | Organization header and opportunities table |
| `/organization/opportunity/new` | Organizations | Create an opportunity |
| `/organization/opportunity/[id]` | Organizations | Edit an opportunity; review and accept/reject applicants |
| `/admin/dashboard` | Admins | Platform totals, charts and links to the management pages |
| `/admin/users` | Admins | All accounts, filterable by role |
| `/admin/organizations` | Admins | All organizations; verify or unverify them |
| `/admin/opportunities` | Admins | All opportunities, filterable by borough and status |
| `/admin/applications` | Admins | All applications, filterable by status and borough |

Logged-in pages use `components/shared/ProtectedRoute.js`. It sends logged-out users to `/auth/login?next=<page>`, and users with the wrong role to their own dashboard.

---

## API reference

All routes live under `pages/api/`. Logged-in routes need an `Authorization: Bearer <access token>` header; the token comes from `/api/auth/login` and is kept in `localStorage` as `token`. Each route queries Supabase **as that user**, so Row Level Security applies.

Errors look like `{ "success": false, "error": "…", "statusCode": 422, "details": { "field": "message" } }`. Successful responses are `{ "success": true, "data": … }`.

### Auth

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/signup` | none | `{ email, password, role, firstName, lastName, organizationName? }`. `role` is `volunteer` or `organization`. Creates the auth user plus the `profiles` row and the `volunteers` or `organizations` row. |
| `POST` | `/api/auth/login` | none | `{ email, password }` → `{ session, user, role }` |
| `GET` | `/api/auth/me` | token | `{ user, profile, role }`. `role` comes from `profiles.role`. |

### Opportunities (public)

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/opportunity/search` | none | Open opportunities. Query: `borough`, `skill`, `limit` (default 20), `offset`. |
| `GET` | `/api/opportunity/:id` | optional | One opportunity. Closed or filled ones are visible only to the owning organization. |
| `POST` | `/api/opportunity/apply` | volunteer | `{ opportunityId }`. 403 if not a volunteer, 404 if not found or not open, 409 if already applied. |

### Volunteers

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` / `PUT` | `/api/volunteer/profile` | volunteer | Read or update `{ firstName, lastName, skills, borough, availability, bio }` |
| `GET` | `/api/volunteer/applications` | volunteer | The volunteer's applications, with opportunity title and status |

### Organizations

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` / `PUT` | `/api/organization/profile` | organization | Read or update `{ name, phone, description, address, borough }`. `email` and `verified` can't be changed here. |
| `GET` | `/api/organization/opportunities` | organization | The organization's opportunities, newest first, with application counts |
| `POST` | `/api/organization/opportunity` | organization | Create an opportunity (always starts `open`) |
| `GET` / `PUT` | `/api/organization/opportunity/:id` | organization | Read or update one of the organization's opportunities. `PUT` accepts any subset of fields, including `status`. |
| `GET` | `/api/organization/opportunity/:id/applications` | organization | Applicants with volunteer details, plus the opportunity's required skills and slot counts |
| `PUT` | `/api/organization/application/:id` | organization | `{ status: "accepted" \| "rejected", notes? }`. 409 if the application was withdrawn or every slot is filled. |

### Admin

Every admin route checks the token, then confirms `profiles.role = 'admin'` on the server (`lib/authenticateAdmin.js`); anyone else gets **403**. Only after that check do these routes use the service-role client, which reads across all accounts. List routes take `limit` (1–100, default 20) and `offset`, return `{ data, total, limit, offset }`, and reject unknown filter values with **422**.

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/admin/dashboard` | admin | `{ totalUsers, totalOrganizations, totalOpportunities, pendingApplications }` |
| `GET` | `/api/admin/charts` | admin | `{ opportunitiesByBorough, applicationsByStatus }`, each a list of `{ label, count }` |
| `GET` | `/api/admin/users` | admin | Accounts with name, email, role and join date. Filter: `role` |
| `GET` | `/api/admin/organizations` | admin | Organizations with verification status and opportunity count |
| `GET` | `/api/admin/opportunities` | admin | All opportunities with organization and application count. Filters: `borough`, `status` |
| `GET` | `/api/admin/applications` | admin | All applications with volunteer, opportunity and organization. Filters: `status`, `borough` |
| `PUT` | `/api/admin/organization/:id/verify` | admin | `{ verified: true \| false }` |

---

## Getting started

### 1. Requirements

- Node.js 20 or newer
- A Supabase project with the [database tables](#database) set up

### 2. Environment variables

Copy the example file and fill in the values from **Supabase → Project Settings → API**:

```bash
cp .env.example .env.local
```

| Variable | Used for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public "anon" key; every API route uses it with the user's token |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only.** Used only by `/api/auth/signup` to create profile rows before the new user has a session. Never give it a `NEXT_PUBLIC_` prefix and never commit it. |

`.env.local` is git-ignored.

### 3. Install and run

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:3000.

| Script | What it does |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run lint` | ESLint |
| `npm run build` | Production build |
| `npm run start` | Serve a production build |

### 4. Database policies

Run these once, in order, in the **Supabase SQL Editor**, after the base tables and policies exist:

1. `supabase/week3_policies.sql` lets users read their own `profiles` row, which `/api/auth/me` needs for the role.
2. `supabase/migrations/20261115_application_flow_rls.sql` lets organizations read the profiles of volunteers who applied to their opportunities.

> Organization rows are meant to be private. If logged-out users can read the `organizations` table, look for a public `SELECT` policy (`select policyname, cmd, roles, qual from pg_policies where tablename = 'organizations';`) and drop it.

### 5. Making an admin

Sign-up only offers Volunteer or Organization, so nobody can make themselves an admin. To create one, sign up normally, then run this in the Supabase SQL Editor with that account's email:

```sql
update profiles set role = 'admin'
where id = (select id from auth.users where email = 'someone@example.com');
```

They'll land on `/admin/dashboard` the next time they log in.

---

## Database

The schema isn't in this repo yet. The code expects these Supabase tables, with Row Level Security turned on:

| Table | Key columns |
|---|---|
| `profiles` | `id` (= auth user id), `role` (`volunteer`, `organization` or `admin`) |
| `volunteers` | `id`, `first_name`, `last_name`, `email`, `phone`, `skills` (text[]), `borough`, `availability`, `bio`, `updated_at` |
| `organizations` | `id`, `name`, `email`, `phone`, `description`, `address`, `borough`, `verified`, `created_at`, `updated_at` |
| `opportunities` | `id`, `organization_id`, `title`, `description`, `required_skills` (text[]), `commitment`, `start_date`, `end_date`, `slots_available`, `location`, `borough`, `status` (`open`, `filled` or `closed`), `created_at`, `updated_at` |
| `applications` | `id`, `volunteer_id`, `opportunity_id`, `status` (`pending`, `accepted`, `rejected` or `withdrawn`), `notes`, `applied_at`, `reviewed_at`, `reviewed_by`; unique on `(volunteer_id, opportunity_id)` |

Allowed values for boroughs, skills and availability are listed in `lib/volunteerOptions.js`. Commitments and statuses are in `lib/opportunity.js`. Values are stored in lowercase (`staten_island`, `event_setup`).

---

## Project structure

```
pages/                 Routes (Pages Router)
  api/                 API routes (see API reference)
  auth/                Log in and sign up
  volunteer/           Browse, opportunity detail, dashboard, profile
  organization/        Dashboard, create and edit opportunities
  admin/               Admin dashboard and management pages
components/
  auth/                LoginForm, SignupForm
  organization/        OpportunityForm, OpportunityList, OpportunityDetail,
                       ApplicationList, ApplicationDetail (review panel)
  volunteer/           ProfileForm, VolunteerDashboard, ApplicationList,
                       OpportunityApplyButton
  admin/               DashboardCharts
  shared/              ProtectedRoute, OpportunityCard
lib/
  supabase.js          Server helpers: getSupabase(token), authenticate(req),
                       authenticateOrganization(req), sendError, isUuid, allowMethods
  supabaseAdmin.js     Service-role client (server only; signup and admin routes)
  authenticateAdmin.js authenticateAdmin(req): token check + profiles.role = 'admin'
  auth.js              Browser session helpers: saveSession, clearSession,
                       dashboardFor(role), safeNextPath
  fetchApi.js          Browser helper for calling /api with the saved token
  opportunity.js       Opportunity validation and formatting, shared by forms and API
  volunteerOptions.js  Boroughs, skills, availability and their display labels
supabase/              SQL to run in the Supabase SQL Editor
styles/globals.css     Tailwind and the site-wide light theme
```

---

## Conventions

- **Next.js 16 differs from older versions.** Check the bundled docs in `node_modules/next/dist/docs/` before relying on older Next.js knowledge (see `AGENTS.md`).
- **Query Supabase as the user.** In API routes, use `authenticate(req)` or `authenticateOrganization(req)` from `lib/supabase.js`. A plain anon client without the user's token runs as an anonymous user, and RLS rejects the query. Admin routes use `authenticateAdmin(req)` from `lib/authenticateAdmin.js`, and only use its service-role client after that check passes.
- **Use the shared value lists.** Skills, boroughs and availability come from `lib/volunteerOptions.js`, so volunteer profiles and opportunities store the same values and skill search works. Show values with `skillLabel`, `boroughLabel` and `availabilityLabel`, not by reformatting strings.
- **One light theme.** The page is `gray-50` with `gray-900` text, white cards and inputs, and `border-gray-300` controls. Don't add `dark:` styles or a `prefers-color-scheme` override. White surfaces set their own text color (`text-gray-900`).
- **Router readiness.** Read `router.isReady` inside `useEffect`, not while rendering, or the server and client HTML won't match.

---

## Not built yet

- **Log out**: there's no log-out button, and `pages/api/auth/logout.js` is empty. `clearSession()` in `lib/auth.js` exists for when one is added.
- **Withdrawing an application**: the database and review screen understand a `withdrawn` status, but volunteers can't withdraw yet.
- **Review notes for volunteers**: notes are internal; `/api/volunteer/applications` doesn't return them.
- **Organization names for volunteers**: hidden because organization rows are private. Showing just the name would need a narrow view or database function.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Styles look out of date even after restarting `npm run dev` | The Turbopack dev cache is stale. Stop the server, run `rm -rf .next`, and start it again. |
| A page with an id in the URL stays on "Loading…" in development | Hard-reload (Cmd+Shift+R) or open it in a new tab. If it keeps happening, restart the dev server. Production builds aren't affected. |
| "Another next dev server is already running" | One is already running for this folder; open the URL it prints, or stop it with `kill $(lsof -ti tcp:3000 -sTCP:LISTEN)`. |
| `/api/auth/me` returns `profile: null`, or role-protected pages bounce you | Run `supabase/week3_policies.sql`. The role falls back to `user_metadata.role` if the profile can't be read. |
| Signup fails with "Server is missing SUPABASE_SERVICE_ROLE_KEY" | Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` and restart the dev server. |
| "new row violates row-level security policy" | The route is querying without the user's token. Use `authenticate(req)` from `lib/supabase.js`. |

## Database Schema

The VMS-NYC application uses Supabase PostgreSQL.

A snapshot of the live public database schema is available here:

[supabase/schema.sql](supabase/schema.sql)

The schema includes:
- Database table definitions and relationships
- Row Level Security (RLS) policies
- Database functions
- Permissions and grants

The schema was exported from the Supabase project on November 27, 2026.

**Note:** This is a schema-only snapshot for documentation and review. It does not include user records or application data and has not been validated as a complete database restoration script.
