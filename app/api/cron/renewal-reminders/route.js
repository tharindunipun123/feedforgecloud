import { NextResponse } from 'next/server';
import { processRenewalReminders, sendPendingRenewalEmails } from '@/lib/billing/renewal-jobs';

export const runtime = 'nodejs';

function authorize(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;

  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : request.headers.get('x-cron-secret');
  return token === secret;
}

export async function POST(request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const mode = body.mode || 'full';

    if (mode === 'pending-emails') {
      const result = await sendPendingRenewalEmails();
      return NextResponse.json({ ok: true, mode, ...result });
    }

    const result = await processRenewalReminders({ sendEmails: body.sendEmails !== false });
    return NextResponse.json({ ok: true, mode: 'full', ...result });
  } catch (err) {
    console.error('[cron] renewal-reminders error:', err);
    return NextResponse.json({ error: err.message || 'Cron job failed.' }, { status: 500 });
  }
}

export async function GET(request) {
  return POST(request);
}
