import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function getEmailPortalAdmin() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('id,role,is_active').eq('user_id', user.id).maybeSingle();
  if (!profile?.is_active || !['admin', 'super_admin'].includes(profile.role)) return null;
  return profile;
}
