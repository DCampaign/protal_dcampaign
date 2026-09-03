'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentClientContext } from '@/lib/queries/client-context';

const approvalResponseSchema = z.object({
  approvalId: z.string().uuid(),
  status: z.enum(['approved', 'changes_requested']),
  response: z.string().trim().max(2000).optional(),
}).superRefine((value, ctx) => {
  if (value.status === 'changes_requested' && !value.response) ctx.addIssue({ code: 'custom', path: ['response'], message: 'Please describe the requested changes.' });
});

export async function respondToApproval(formData: FormData) {
  const parsed = approvalResponseSchema.safeParse({ approvalId: formData.get('approvalId'), status: formData.get('status'), response: formData.get('response') });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Invalid approval response');
  const { supabase, clientId } = await getCurrentClientContext();
  if (!supabase || !clientId) throw new Error('Authentication required');
  const { data: approval } = await supabase.from('approvals').select('id').eq('id', parsed.data.approvalId).eq('client_id', clientId).eq('status', 'pending').maybeSingle();
  if (!approval) throw new Error('Approval request was not found or has already been answered');
  const { error } = await supabase.rpc('respond_to_approval', { target_approval: parsed.data.approvalId, response_status: parsed.data.status, response_text: parsed.data.response || null });
  if (error) throw new Error('The approval response could not be saved');
  revalidatePath('/client/approvals');
  revalidatePath('/client/dashboard');
}
