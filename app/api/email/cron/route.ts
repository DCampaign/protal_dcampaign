import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isHostingerSmtpConfigured, sendHostingerEmail } from '@/lib/email/hostinger';

export const dynamic = 'force-dynamic';

type ClaimedRecipient = {
  id: string;
  campaign_id: string;
  email: string;
  subject: string;
  html: string;
  interval_minutes: number;
};

function hasValidCronSecret(request: Request) {
  const secret = process.env.EMAIL_CRON_SECRET;
  if (!secret) return false;
  const authorization = request.headers.get('authorization');
  return authorization === 'Bearer ' + secret || request.headers.get('x-cron-secret') === secret;
}

async function runQueue(request: Request) {
  if (!hasValidCronSecret(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isHostingerSmtpConfigured()) return NextResponse.json({ error: 'Hostinger SMTP is not configured.' }, { status: 503 });

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc('claim_email_recipients', { max_batch: 25, rolling_daily_limit: 100 });
  if (error) return NextResponse.json({ error: 'Could not claim queued recipients.' }, { status: 500 });
  const claimed = (data ?? []) as ClaimedRecipient[];
  let sent = 0;
  let failed = 0;
  const campaignIntervals = new Map<string, number>();

  for (const recipient of claimed) {
    campaignIntervals.set(recipient.campaign_id, recipient.interval_minutes);
    try {
      await sendHostingerEmail({ to: recipient.email, subject: recipient.subject, html: recipient.html });
      await admin.from('email_recipients').update({ status: 'sent', sent_at: new Date().toISOString(), last_error: null }).eq('id', recipient.id);
      sent += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message.slice(0, 500) : 'Unknown delivery error';
      await admin.from('email_recipients').update({ status: 'failed', last_error: message }).eq('id', recipient.id);
      failed += 1;
    }
  }

  for (const [campaignId, intervalMinutes] of campaignIntervals) {
    const { count } = await admin.from('email_recipients').select('id', { count: 'exact', head: true }).eq('campaign_id', campaignId).eq('status', 'queued');
    const complete = (count ?? 0) === 0;
    await admin.from('email_campaigns').update({
      status: complete ? 'completed' : 'sending',
      last_run_at: new Date().toISOString(),
      next_run_at: complete ? null : new Date(Date.now() + intervalMinutes * 60_000).toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', campaignId);
  }

  return NextResponse.json({ claimed: claimed.length, sent, failed, dailyLimit: 100 });
}

export async function GET(request: Request) { return runQueue(request); }
export async function POST(request: Request) { return runQueue(request); }
