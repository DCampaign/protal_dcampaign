import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isAdminRole } from '@/lib/auth/permissions';

export async function requireUser() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/client/login');
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!user) return null;
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/client/login');
  const { data: profile } = await supabase.from('profiles').select('id,full_name,email,role,is_active').eq('user_id', user.id).single();
  if (!profile?.is_active || !isAdminRole(profile.role)) redirect('/client/dashboard');
  return { user, profile };
}

export async function requireClientMembership(clientId: string) {
  const user = await requireUser();
  if (!user) return null;
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/client/login');
  const { data: profile } = await supabase.from('profiles').select('id,role,is_active').eq('user_id', user.id).maybeSingle();
  if (!profile?.is_active) redirect('/client/login?error=inactive');
  if (isAdminRole(profile.role)) return { user, profile, clientId };
  const { data: membership } = await supabase.from('client_members').select('id').eq('client_id', clientId).eq('profile_id', profile.id).maybeSingle();
  if (!membership) redirect('/client/dashboard?error=access_denied');
  return { user, profile, clientId };
}

export async function canAccessService(clientId: string, serviceSlug: string) {
  await requireClientMembership(clientId);
  const supabase = await createSupabaseServerClient();
  if (!supabase) return false;
  const { data } = await supabase.from('client_services').select('id,services!inner(slug)').eq('client_id', clientId).eq('services.slug', serviceSlug).in('status', ['upcoming', 'active', 'paused']).limit(1);
  return Boolean(data?.length);
}

export async function canAccessProject(projectId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return false;
  const { data: project } = await supabase.from('projects').select('client_id').eq('id', projectId).maybeSingle();
  if (!project) return false;
  await requireClientMembership(project.client_id);
  return true;
}
