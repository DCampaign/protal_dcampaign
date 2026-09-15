# CRM production foundation

The CRM uses the existing Next.js application, Supabase Auth, PostgreSQL, and Row Level Security. Apply `supabase/migrations/202609150001_crm_foundation.sql` after the existing migrations before enabling database-backed CRM records.

## Roles

- `super_admin`: all CRM operations and security administration.
- `admin`: all normal CRM and agency operations.
- `sales`: prospects, leads, outreach, follow-ups, meetings, deals, and proposals.
- `account_manager`: assigned clients, services, meetings, projects, and operational work.
- `team_member`: assigned operational work and permitted activities.
- `finance`: invoices, payments, and required client finance information.
- `client`: no internal CRM access.

Permissions must be checked in server code and in PostgreSQL RLS. Hiding a control in the browser is not authorization.

## Existing browser-data migration

The current browser key is `dcampaign-crm`. Do not clear it before migration.

1. Download and retain a JSON export of the entire value.
2. Record the source browser, exporter, export time, and SHA-256 checksum.
3. Run a validation-only import first.
4. Review invalid fields and possible matches by phone, email, website, and company name.
5. Map service names to `services.id` and team names to `profiles.id`.
6. Import Prospects before Leads so conversion links can be restored.
7. Import Clients before Payments.
8. Store each old browser ID in `legacy_browser_id` and the import checksum in `crm_imports` to make retries idempotent.
9. Compare record totals and manually review several converted prospects and follow-ups.
10. Keep the JSON export and browser data until the database version is accepted.

Never silently merge possible duplicates. An administrator must choose whether a record is new or maps to an existing record.

## Backup policy

Until the production Supabase plan and its backup features are verified:

- Create an encrypted logical database export every day.
- Retain daily exports for 14 days and monthly exports for 12 months.
- Store backups separately from the application and restrict access to the owner or designated administrator.
- Test a restore into a separate Supabase project at least quarterly.
- Before every CRM schema migration, take a fresh database export and record the migration version.

Do not claim point-in-time recovery is available unless it is enabled and tested on the selected Supabase plan.

## Deployment checklist

1. Back up the current Supabase database.
2. Apply migrations in filename order.
3. Create or update internal users and assign the least-privileged role.
4. Confirm all production environment variables in Hostinger.
5. Build and deploy the same reviewed Git revision.
6. Test unauthenticated access, each internal role, and a client-account denial.
7. Verify RLS with two separate users.
8. Import browser data using the safe migration procedure.
9. Compare totals and retain the source export.
10. Test backup restoration before declaring the CRM production-ready.
