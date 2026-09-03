'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/guards';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const optionalText = z.string().trim().max(240).optional().transform((value) => value || null);
const clientSchema = z.object({
  companyName: z.string().trim().min(2).max(140), slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  website: optionalText, industry: optionalText, contactName: optionalText, contactEmail: z.union([z.literal(''), z.string().email()]).transform((value) => value || null),
  contactPhone: optionalText, packageName: optionalText, status: z.enum(['lead', 'onboarding', 'active', 'paused', 'completed', 'archived']),
});

export async function createClientAction(formData: FormData) {
  const auth = await requireAdmin();
  if (!auth) throw new Error('Administrator access required');
  const parsed = clientSchema.safeParse({ companyName: formData.get('companyName'), slug: formData.get('slug'), website: formData.get('website'), industry: formData.get('industry'), contactName: formData.get('contactName'), contactEmail: formData.get('contactEmail'), contactPhone: formData.get('contactPhone'), packageName: formData.get('packageName'), status: formData.get('status') });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Invalid client information');
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error('Supabase is not configured');
  const { data, error } = await supabase.from('clients').insert({ company_name: parsed.data.companyName, slug: parsed.data.slug, website: parsed.data.website, industry: parsed.data.industry, contact_name: parsed.data.contactName, contact_email: parsed.data.contactEmail, contact_phone: parsed.data.contactPhone, package_name: parsed.data.packageName, status: parsed.data.status }).select('id').single();
  if (error || !data) throw new Error(error?.code === '23505' ? 'That client slug is already in use' : 'Client could not be created');
  redirect(`/admin/clients/${data.id}`);
}

const invitationSchema = z.object({ clientId: z.string().uuid(), email: z.string().trim().email(), fullName: z.string().trim().min(2).max(120), isPrimary: z.enum(['true', 'false']).default('false') });
export async function inviteClientUserAction(formData: FormData) {
  await requireAdmin();
  const parsed = invitationSchema.safeParse({ clientId: formData.get('clientId'), email: formData.get('email'), fullName: formData.get('fullName'), isPrimary: formData.get('isPrimary') ?? 'false' });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Invalid invitation');
  const admin = createSupabaseAdminClient();
  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/auth/callback?next=/client/reset-password`;
  const { data, error } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, { data: { full_name: parsed.data.fullName }, redirectTo });
  if (error || !data.user) throw new Error(error?.message ?? 'Invitation could not be sent');
  const { data: profile, error: profileError } = await admin.from('profiles').upsert({ user_id: data.user.id, full_name: parsed.data.fullName, email: parsed.data.email, role: 'client', is_active: true }, { onConflict: 'user_id' }).select('id').single();
  if (profileError || !profile) throw new Error('Invitation was created, but the client profile could not be linked');
  const { error: membershipError } = await admin.from('client_members').upsert({ client_id: parsed.data.clientId, profile_id: profile.id, client_role: parsed.data.isPrimary === 'true' ? 'primary' : 'member', is_primary: parsed.data.isPrimary === 'true' }, { onConflict: 'client_id,profile_id' });
  if (membershipError) throw new Error('Invitation was created, but organization access could not be linked');
  revalidatePath(`/admin/clients/${parsed.data.clientId}`);
}

const serviceSchema = z.object({ clientId: z.string().uuid(), serviceId: z.string().uuid() });
export async function assignServiceAction(formData: FormData) {
  await requireAdmin();
  const parsed = serviceSchema.safeParse({ clientId: formData.get('clientId'), serviceId: formData.get('serviceId') });
  if (!parsed.success) throw new Error('Invalid service assignment');
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error('Supabase is not configured');
  const { error } = await supabase.from('client_services').upsert({ client_id: parsed.data.clientId, service_id: parsed.data.serviceId, status: 'active' }, { onConflict: 'client_id,service_id' });
  if (error) throw new Error('Service could not be assigned');
  revalidatePath(`/admin/clients/${parsed.data.clientId}`);
}
