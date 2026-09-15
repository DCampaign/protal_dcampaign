'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { loginSchema } from '@/lib/validations/auth';
import { isCrmRole } from '@/lib/auth/permissions';

export type CrmLoginState = { error?: string };

export async function crmLoginAction(_: CrmLoginState, formData: FormData): Promise<CrmLoginState> {
  const parsed = loginSchema.safeParse({ email: formData.get('email'), password: formData.get('password') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check your details and try again.' };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'CRM authentication is not configured.' };
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: 'The email address or password is incorrect.' };
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('role,is_active').eq('user_id', user?.id ?? '').maybeSingle();
  if (!profile?.is_active || !isCrmRole(profile.role)) {
    await supabase.auth.signOut();
    return { error: 'CRM access is restricted to active Admin and Team Member accounts.' };
  }
  redirect('/crm');
}

export async function crmLogoutAction() {
  const supabase = await createSupabaseServerClient();
  if (supabase) await supabase.auth.signOut();
  redirect('/crm/login');
}
