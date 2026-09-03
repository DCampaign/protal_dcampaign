import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function getCurrentClientContext() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { supabase: null, clientId: null };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, clientId: null };
  const { data: membership } = await supabase.from('client_members').select('client_id').eq('profile_id', (await supabase.from('profiles').select('id').eq('user_id', user.id).single()).data?.id ?? '').limit(1).single();
  return { supabase, clientId: membership?.client_id ?? null };
}
