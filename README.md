# DCampaign Digital Client Portal

The private client workspace for DCampaign Digital at `portal.dcampaign.com`. It uses the same DCampaign design system—Manrope body type, Outfit display type, charcoal surfaces, orange `#f16133` accents, compact labels, rounded cards, subtle borders, and restrained motion—while adapting the structure for client work.

## Stack

Next.js App Router, TypeScript, Tailwind CSS, Supabase PostgreSQL/Auth/Storage, and server-side Supabase access through `@supabase/ssr`.

## Local setup

```bash
npm install
copy .env.example .env.local
npm run dev
```

Set these values in `.env.local`:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MAIN_SITE_URL=https://dcampaign.com
```

## Supabase setup

Run migrations in order from `supabase/migrations/`:

1. `202609030001_foundation.sql`
2. `202609030002_project_management.sql`
3. `202609030003_reporting.sql`
4. `202609030004_client_operations.sql`
5. `202609030005_security_notifications.sql`

For a non-production project, optionally run `supabase/seed.sql` for clearly labelled Acme Fashion demo data. Create the first user in Supabase Auth, then change its profile role to `super_admin` in the dashboard or SQL editor. Never commit service-role credentials.

The `client-files` Storage bucket is private. Files must be served through authenticated access or short-lived signed URLs; never publish permanent client file URLs.

## Routes

Public: `/`, `/client/login`.

Client workspace: `/client/dashboard`, `/client/projects`, `/client/projects/[projectId]`, `/client/seo`, `/client/meta-ads`, `/client/google-ads`, `/client/social-media`, `/client/website-development`, `/client/content`, `/client/approvals`, `/client/reports`, `/client/files`, `/client/invoices`, `/client/support`, `/client/activity`, `/client/notifications`, `/client/settings`.

Administration: `/admin/dashboard`, `/admin/clients`, `/admin/clients/new`, `/admin/clients/[clientId]`, plus operational queues for projects, tasks, services, reports, files, approvals, invoices, support, and team access.

## Creating the first administrator and client

Create the first user in Supabase Auth, then update the generated `profiles` row to `super_admin` from the Supabase SQL editor. Sign in and open `/admin/dashboard`. Create the organization, assign its purchased services, then send an invitation from the client detail page. The invited user is linked through `client_members`; never share an admin login with a client.

Authorization is enforced twice: authenticated route protection in `proxy.ts`, and database Row Level Security on every client-owned table. Service links are generated from `client_services`, while service pages also check access server-side. Client files use the private `client-files` bucket with paths shaped as `clients/{client_uuid}/filename.ext` and are downloaded through short-lived signed URLs.

## Quality gates

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Before production, verify authenticated route protection, Supabase RLS cross-client isolation, signed file URLs, approval response authorization, support-ticket validation, mobile navigation, keyboard focus, empty/loading/error states, and no private content in metadata. The portal uses `noindex` metadata and security headers by default.

## Deployment

Deploy the `main` branch to the separate Hostinger application for `portal.dcampaign.com`. Keep the main `dcampaign.com` application and repository separate. Configure the production Supabase URL, publishable key, service key, and redirect URLs for `https://portal.dcampaign.com`.
