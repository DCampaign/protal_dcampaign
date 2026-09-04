'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { loginSchema } from '@/lib/validations/auth';
import { isAdminRole } from '@/lib/auth/permissions';

export type LoginState = { error?: string };

export async function loginAction(_: LoginState, formData: FormData): Promise<LoginState> {
  const mode = formData.get('loginMode') === 'employee' ? 'employee' : 'client';
  const parsed = loginSchema.safeParse({ email: formData.get('email'), password: formData.get('password') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check your details and try again.' };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Portal authentication is not configured yet.' };
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: 'The email address or password is incorrect.' };
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('role,is_active').eq('user_id', user?.id ?? '').maybeSingle();
  if (!profile?.is_active) { await supabase.auth.signOut(); return { error: 'This account is not active. Contact DCampaign support.' }; }
  if (mode === 'employee' && !isAdminRole(profile.role)) { await supabase.auth.signOut(); return { error: 'Employee access is restricted to authorized team accounts.' }; }
  redirect(mode === 'employee' ? '/admin/dashboard' : '/client/dashboard');
}


