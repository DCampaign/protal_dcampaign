import { createSupabaseServerClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';

export async function getCurrentClientContext() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { supabase: null, user: null, profile: null, client: null, clientId: null, services: [] };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null, client: null, clientId: null, services: [] };
  const { data: profile } = await supabase.from('profiles').select('id,full_name,email,phone,avatar_url,role,is_active').eq('user_id', user.id).maybeSingle();
  if (!profile) return { supabase, user, profile: null, client: null, clientId: null, services: [] };
  const { data: membership } = await supabase.from('client_members').select('client_id,client_role,is_primary,clients(id,company_name,logo_url,status,package_name,account_manager_id)').eq('profile_id', profile.id).order('is_primary', { ascending: false }).limit(1).maybeSingle();
  const clientRelation = membership?.clients;
  const client = Array.isArray(clientRelation) ? clientRelation[0] ?? null : clientRelation ?? null;
  const clientId = membership?.client_id ?? null;
  const { data: serviceRows } = clientId
    ? await supabase.from('client_services').select('id,status,progress,services(id,name,slug,icon,display_order)').eq('client_id', clientId).in('status', ['upcoming', 'active', 'paused']).order('service_id')
    : { data: [] };
  const services = (serviceRows ?? []).map((row) => {
    const relation = row.services;
    const service = Array.isArray(relation) ? relation[0] : relation;
    return service ? { ...service, status: row.status, progress: row.progress } : null;
  }).filter(Boolean);
  return { supabase, user, profile, client, clientId, services };
}

export async function requireCurrentClientContext() {
  const context = await getCurrentClientContext();
  if (!context.user) redirect('/client/login');
  if (!context.clientId || !context.client || !context.profile) redirect('/client/dashboard?error=workspace_not_linked');
  return context;
}

export async function requireCurrentServiceContext(serviceSlug: string) {
  const context = await requireCurrentClientContext();
  if (!context.services.some((service) => service?.slug === serviceSlug)) notFound();
  return context;
}
