import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentClientContext } from '@/lib/queries/client-context';

const supportRequestSchema = z.object({
  subject: z.string().trim().min(3).max(160),
  category: z.enum(['general', 'seo', 'social-media', 'meta-ads', 'google-ads', 'website', 'billing']).default('general'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  message: z.string().trim().min(10).max(5000),
});

export async function POST(request: Request) {
  const { supabase, clientId, profile } = await getCurrentClientContext();
  if (!supabase || !clientId || !profile) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const parsed = supportRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid support request' }, { status: 400 });
  const { data: ticket, error } = await supabase.from('support_tickets').insert({ client_id: clientId, created_by: profile.id, subject: parsed.data.subject, category: parsed.data.category, priority: parsed.data.priority }).select('id').single();
  if (error || !ticket) return NextResponse.json({ error: 'Could not create support request' }, { status: 500 });
  const { error: messageError } = await supabase.from('support_messages').insert({ ticket_id: ticket.id, author_id: profile.id, body: parsed.data.message });
  if (messageError) return NextResponse.json({ error: 'Could not save support message' }, { status: 500 });
  return NextResponse.json({ id: ticket.id }, { status: 201 });
}
