# DCampaign Portal

The client-facing workspace for DCampaign Digital. The first MVP slice is built in the same TypeScript, Next.js, Tailwind, Manrope, Outfit, charcoal, and orange design system as the DCampaign website.

## Routes

- `/` — branded portal entry page
- `/client/login` — client sign-in experience (demo form currently routes to the dashboard)
- `/client/dashboard` — Phase 1 dashboard preview with service progress, SEO delivery, Meta Ads, Social Media, activity, and documents

## Subdomain handoff

The intended public host is `portal.dcampaign.com`. Point that subdomain at the eventual deployment target, then set the app’s public URL in the hosting provider’s environment settings. The route structure is already scoped under `/client/*`, so a future auth layer can protect those routes without changing the marketing site.

The current login and dashboard use representative demo data. Production authentication, row-level client access, Supabase/Postgres persistence, file storage, and API-backed analytics should be added in the next implementation phase.
