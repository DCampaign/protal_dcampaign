import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getEmailPortalAdmin } from '@/lib/email/admin-auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const campaignSchema = z.object({
  subject: z.string().trim().min(3).max(180),
  html: z.string().trim().min(20).max(300_000),
  recipients: z.array(z.string().email()).min(1).max(100),
  batchSize: z.number().int().min(1).max(25).default(25),
  intervalMinutes: z.number().int().min(30).max(1440).default(30),
});

export async function POST(request: Request) {
  const profile = await getEmailPortalAdmin();
  if (!profile) return NextResponse.json({ error: 'Administrator access is required.' }, { status: 401 });
  const parsed = campaignSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid campaign.' }, { status: 400 });

  const data = parsed.data;
  const admin = createSupabaseAdminClient();
  const { data: campaign, error } = await admin.from('email_campaigns').insert({
    created_by: profile.id,
    subject: data.subject,
    html: data.html,
    status: 'scheduled',
    batch_size: data.batchSize,
    interval_minutes: data.intervalMinutes,
    daily_limit: 100,
    scheduled_at: new Date().toISOString(),
    next_run_at: new Date().toISOString(),
  }).select('id').single();
  if (error || !campaign) return NextResponse.json({ error: 'Could not create the campaign.' }, { status: 500 });

  const rows = data.recipients.map((email) => ({ campaign_id: campaign.id, email: email.toLowerCase() }));
  const { error: recipientsError } = await admin.from('email_recipients').insert(rows);
  if (recipientsError) {
    await admin.from('email_campaigns').delete().eq('id', campaign.id);
    return NextResponse.json({ error: 'Could not queue the campaign recipients.' }, { status: 500 });
  }
  return NextResponse.json({ id: campaign.id, recipientCount: rows.length, status: 'scheduled' }, { status: 201 });
}
