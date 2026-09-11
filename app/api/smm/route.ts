import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getEmailPortalAdmin } from '@/lib/email/admin-auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { encryptKey, providerRequest, validateEndpoint } from '@/lib/smm/provider';
import { catalogSchema } from '@/lib/smm/validation';

export const runtime = 'nodejs';
const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('provider'), id: z.string().uuid().optional(), name: z.string().trim().min(2).max(80), endpoint: z.string().url().max(500), key: z.string().trim().min(1).max(2048) }),
  z.object({ action: z.literal('delete-provider'), providerId: z.string().uuid() }),
  z.object({ action: z.literal('sync'), providerId: z.string().uuid() }),
  z.object({ action: z.literal('balance'), providerId: z.string().uuid() }),
  z.object({ action: z.literal('order'), id: z.string().uuid(), serviceId: z.string().uuid(), link: z.string().url().max(2000).refine(value => ['https:', 'http:'].includes(new URL(value).protocol)), quantity: z.number().int().positive(), confirmed: z.literal(true) }),
  z.object({ action: z.literal('refresh'), orderId: z.string().uuid() }),
]);
const providerOrder = z.object({ order: z.union([z.string().min(1), z.number().positive()]).transform(String) });
const json = (value: unknown, status = 200) => NextResponse.json(value, { status, headers: { 'Cache-Control': 'no-store' } });

export async function GET() {
  if (!await getEmailPortalAdmin()) return json({ error: 'Sign in with an active administrator account.' }, 401);
  try {
    const db = createSupabaseAdminClient();
    const [providers, services, orders] = await Promise.all([
      db.from('smm_providers').select('id,name,endpoint').order('created_at'),
      db.from('smm_services').select('*').order('name').limit(5000),
      db.from('smm_orders').select('*').order('created_at', { ascending: false }).limit(100),
    ]);
    if (providers.error || services.error || orders.error) return json({ error: 'SMM storage is not ready. Apply the SMM panel database migration.' }, 503);
    return json({ providers: providers.data, services: services.data, orders: orders.data });
  } catch { return json({ error: 'SMM storage is unavailable. Check server configuration.' }, 503); }
}
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin) {
    const requestUrl = new URL(request.url);
    const forwardedHost = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
    const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() ?? requestUrl.protocol.replace(':', '');
    const forwardedOrigin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : undefined;
    const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
    const allowedOrigins = new Set([requestUrl.origin, forwardedOrigin, configuredOrigin].filter(Boolean));
    if (!allowedOrigins.has(origin)) return json({ error: 'Invalid request origin.' }, 403);
  }
  if (!await getEmailPortalAdmin()) return json({ error: 'Administrator access required.' }, 401);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: 'Check the required fields and try again.' }, 400);
  const input = parsed.data;
  try {
    const db = createSupabaseAdminClient();
    if (input.action === 'provider') {
      const endpoint = validateEndpoint(input.endpoint);
      const values = { name: input.name, endpoint, encrypted_key: encryptKey(input.key) };
      // Changing a provider endpoint would invalidate existing service/order IDs.
      if (input.id) {
        const { data: existing } = await db.from('smm_providers').select('endpoint').eq('id', input.id).single();
        if (!existing || existing.endpoint !== endpoint) throw new Error('Add a new provider when changing API endpoints.');
      }
      const result = input.id ? await db.from('smm_providers').update(values).eq('id', input.id) : await db.from('smm_providers').insert(values);
      if (result.error) throw new Error('Could not save provider. Check the SMM database migration.');
      return json({ message: 'Provider saved. Sync services to verify the connection.' });
    }
    if (input.action === 'delete-provider') {
      const { data: linked } = await db.from('smm_services').select('id').eq('provider_id', input.providerId).limit(1);
      if (linked?.length) throw new Error('Sync services must be removed before deleting this provider.');
      const result = await db.from('smm_providers').delete().eq('id', input.providerId);
      if (result.error) throw new Error('Could not delete provider.');
      return json({ message: 'Provider deleted.' });
    }
    if (input.action === 'sync' || input.action === 'balance') {
      const { data: provider } = await db.from('smm_providers').select('*').eq('id', input.providerId).single();
      if (!provider) throw new Error('Provider not found.');
      if (input.action === 'balance') {
        const result = z.object({ balance: z.coerce.number().finite(), currency: z.string().min(1).max(12) }).safeParse(await providerRequest(provider, { action: 'balance' }));
        if (!result.success) throw new Error('Provider did not return a supported balance response.');
        return json({ message: `${provider.name}: ${result.data.balance.toFixed(2)} ${result.data.currency} available.` });
      }
      const result = catalogSchema.safeParse(await providerRequest(provider, { action: 'services' }));
      if (!result.success) throw new Error('Catalog incompatible, empty, or exceeds 5,000 services. This adapter supports the standard SMM API.');
      const rows = result.data.map(s => ({ provider_id: provider.id, remote_id: s.service, name: s.name, category: s.category, rate: s.rate, min: s.min, max: s.max, type: s.type }));
      const { error } = await db.from('smm_services').upsert(rows, { onConflict: 'provider_id,remote_id' });
      if (error) throw new Error('Could not save services.');
      return json({ message: `${rows.length} services synced.` });
    }
    if (input.action === 'order') {
      const { data: service } = await db.from('smm_services').select('*').eq('id', input.serviceId).single();
      if (!service || service.type.toLowerCase() !== 'default' || input.quantity < service.min || input.quantity > service.max) throw new Error('Choose a standard service and a quantity within its limits.');
      const { data: provider } = await db.from('smm_providers').select('*').eq('id', service.provider_id).single();
      if (!provider) throw new Error('Provider not found.');
      // Revalidate current pricing and availability before a billable request.
      const liveCatalog = catalogSchema.safeParse(await providerRequest(provider, { action: 'services' }));
      const live = liveCatalog.success ? liveCatalog.data.find(s => s.service === service.remote_id) : undefined;
      if (!live || live.type.toLowerCase() !== 'default' || live.rate !== Number(service.rate) || input.quantity < live.min || input.quantity > live.max) throw new Error('Service availability, limits, or pricing changed. Sync services and review the order again.');
      const { error } = await db.from('smm_orders').insert({ id: input.id, service_id: service.id, link: input.link, quantity: input.quantity, cost: service.rate * input.quantity / 1000 });
      if (error) throw new Error('Order already submitted or could not be saved. Check Orders before trying again.');
      // Never automatically retry an add request: a timeout may still mean acceptance.
      try {
        const result = providerOrder.safeParse(await providerRequest(provider, { action: 'add', service: service.remote_id, link: input.link, quantity: String(input.quantity) }));
        if (!result.success) throw new Error('No order ID');
        const { error: saveError } = await db.from('smm_orders').update({ remote_id: result.data.order, status: 'Pending' }).eq('id', input.id);
        if (saveError) throw new Error('Could not record confirmation');
        return json({ message: 'Order submitted to provider.' });
      } catch {
        await db.from('smm_orders').update({ status: 'Needs review' }).eq('id', input.id);
        return json({ message: 'Order needs review. Check the provider account before placing it again; it may have been accepted.' });
      }
    }
    const { data: order } = await db.from('smm_orders').select('*').eq('id', input.orderId).single();
    if (!order?.remote_id) throw new Error('No provider order ID. Check the provider account manually.');
    const { data: service } = await db.from('smm_services').select('provider_id').eq('id', order.service_id).single();
    const { data: provider } = await db.from('smm_providers').select('*').eq('id', service?.provider_id ?? '').single();
    if (!provider) throw new Error('Provider not found.');
    const result = z.object({ status: z.string().min(1).max(80) }).safeParse(await providerRequest(provider, { action: 'status', order: order.remote_id }));
    if (!result.success) throw new Error('Provider returned an unsupported status response.');
    const { error } = await db.from('smm_orders').update({ status: result.data.status }).eq('id', order.id);
    if (error) throw new Error('Could not save order status.');
    return json({ message: 'Order status updated.' });
  } catch (error) { return json({ error: error instanceof Error ? error.message : 'Request failed.' }, 400); }
}
