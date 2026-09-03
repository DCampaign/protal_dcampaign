'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { resetPasswordSchema } from '@/lib/validations/auth';

export type ResetState = { error?: string };
export async function resetPassword(_: ResetState, formData: FormData): Promise<ResetState> {
  const parsed = resetPasswordSchema.safeParse({ password: formData.get('password'), confirmPassword: formData.get('confirmPassword') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Portal authentication is not configured yet.' };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: 'This reset link is invalid or has expired.' };
  redirect('/client/login?reset=success');
}
