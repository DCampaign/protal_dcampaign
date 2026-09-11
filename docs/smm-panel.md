# DCampaign SMM Panel

Route: `/smm-panel`. Uses existing Supabase administrator accounts (`admin` or `super_admin`, active profile required). Clients cannot access the API.

## Setup

1. Apply `supabase/migrations/202609110001_smm_panel.sql` in the project's Supabase SQL editor.
2. Add a private `SMM_ENCRYPTION_KEY` environment variable containing 32 random bytes in base64. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`. Keep this key stable and backed up: changing it prevents decrypting existing provider keys.
3. Add `SMM_ALLOWED_API_HOSTS`: comma-separated trusted **public** API hostnames, for example `api.provider.example`. No scheme or path. Only allow hosts belonging to providers you trust. Requests require HTTPS and cannot follow redirects.
4. Restart/redeploy the portal. Sign in to `/smm-panel`, open **API providers**, and enter provider name, exact API URL, and API key. Use **Sync services** to verify credentials and import the catalog. Use **Balance** to inspect the provider's account currency and available balance.
5. Review an order before explicitly submitting it. Submission can debit the provider account. Development and verification do not submit orders automatically.

Keys are encrypted with AES-256-GCM before database storage. The encryption key is server-only. API keys, encrypted key material, and raw upstream errors are never returned to the browser. The new database tables use RLS and are not granted to browser roles.

## Supported adapter

Form-encoded HTTPS POST with `key` and `action`:

| Action | Additional parameters | Expected response |
| --- | --- | --- |
| services | none | Array of `service`, `name`, `category`, `type`, `rate`, `min`, `max` |
| balance | none | `balance`, `currency` |
| add | service, link, quantity | `order` |
| status | order | `status` |

Only `Default` order types can be purchased in this version. Custom comments, subscriptions, refill/cancel, OAuth, and other API formats need a provider-specific adapter. Do not promise that arbitrary APIs are compatible.

Rates and estimated charges are expressed in the provider account's currency. There is no customer wallet, currency conversion, payment gateway, or markup in this administrator workspace. Final billing is controlled by the provider.

## Order reliability

Orders are saved before calling the provider. Unique client request IDs prevent repeated submissions using the same ID. A timeout, incompatible response, or failed confirmation write becomes **Needs review**; these requests are never automatically retried because the provider may already have accepted them. Resolve those orders by checking the provider account. **Refresh** manually retrieves current provider status for confirmed IDs.

The interface displays up to 1,000 services and the latest 100 orders. Catalog syncing updates returned services; old entries are retained to preserve order references. Provider credential updates retain the endpoint so historical IDs remain associated with the correct provider. Create a separate provider for a different endpoint.

## Verification

Run lint, TypeScript checking, production build, and the SMM route tests. Use provider mocks for purchase tests, not live accounts. Before production use, complete a provider-authorized sandbox test of catalog, balance, and order status, then explicitly approve a small real order if needed.
