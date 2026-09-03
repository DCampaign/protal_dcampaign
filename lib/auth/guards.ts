import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

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
  const { data: profile } = await supabase.from('profiles').select('role,is_active').eq('user_id', user.id).single();
  if (!profile?.is_active || !['super_admin','admin','team_member'].includes(profile.role)) redirect('/client/dashboard');
  return { user, profile };
}
