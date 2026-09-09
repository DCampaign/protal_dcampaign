import { NextResponse } from 'next/server';
import { processEmailQueue } from '@/lib/email/queue';

export const dynamic = 'force-dynamic';

function hasValidCronSecret(request: Request) {
  const secret = process.env.EMAIL_CRON_SECRET;
  if (!secret) return false;
  const authorization = request.headers.get('authorization');
  return authorization === 'Bearer ' + secret || request.headers.get('x-cron-secret') === secret;
}

async function runQueue(request: Request) {
  if (!hasValidCronSecret(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    return NextResponse.json(await processEmailQueue());
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not process the email queue.';
    return NextResponse.json({ error: message }, { status: message.includes('SMTP') ? 503 : 500 });
  }
}

export async function GET(request: Request) { return runQueue(request); }
export async function POST(request: Request) { return runQueue(request); }
