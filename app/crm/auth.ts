import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isCrmRole } from '@/lib/auth/permissions';

export async function requireCrmUser() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/crm/login?error=configuration');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/crm/login');
  const { data: profile } = await supabase.from('profiles').select('full_name,email,role,is_active').eq('user_id', user.id).maybeSingle();
  if (!profile?.is_active || !isCrmRole(profile.role)) redirect('/crm/login?error=access_denied');
  return { user, profile };
}
