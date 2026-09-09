import 'server-only';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isHostingerSmtpConfigured, sendHostingerEmail } from '@/lib/email/hostinger';

type ClaimedRecipient = {
  id: string;
  campaign_id: string;
  email: string;
  subject: string;
  html: string;
  interval_minutes: number;
};

export type EmailQueueResult = {
  claimed: number;
  sent: number;
  failed: number;
  dailyLimit: number;
};

export async function processEmailQueue(): Promise<EmailQueueResult> {
  if (!isHostingerSmtpConfigured()) {
    throw new Error('Hostinger SMTP is not configured.');
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc('claim_email_recipients', {
    max_batch: 25,
    rolling_daily_limit: 100,
  });
  if (error) throw new Error('Could not claim queued recipients.');

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

  return { claimed: claimed.length, sent, failed, dailyLimit: 100 };
}
