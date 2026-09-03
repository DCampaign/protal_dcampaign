'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { emailSchema } from '@/lib/validations/auth';

export type RecoveryState = { error?: string; success?: string };

export async function requestRecovery(_: RecoveryState, formData: FormData): Promise<RecoveryState> {
  const parsed = emailSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Portal authentication is not configured yet.' };
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo: `${origin}/auth/callback?next=/client/reset-password` });
  if (error) return { error: 'We could not send the recovery email. Please try again.' };
  return { success: 'If an account exists for this email, a secure reset link has been sent.' };
}
