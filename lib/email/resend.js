import { Resend } from 'resend';
import { getEmailConfig } from './config.js';

let resendClient = null;

function getResend() {
  if (!resendClient) {
    const { apiKey } = getEmailConfig();
    if (!apiKey) return null;
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export async function sendEmail({ to, subject, html, text, replyTo, tags = [] }) {
  const config = getEmailConfig();
  const resend = getResend();

  if (!resend) {
    console.warn('[email] RESEND_API_KEY is not set — email skipped.');
    return { skipped: true, reason: 'missing_api_key' };
  }

  const intendedTo = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (!intendedTo.length) {
    console.warn('[email] No recipient — email skipped.');
    return { skipped: true, reason: 'missing_recipient' };
  }

  const actualTo = config.testMode ? [config.testRecipient] : intendedTo;
  const subjectFinal = config.testMode
    ? `[TEST for ${intendedTo.join(', ')}] ${subject}`
    : subject;

  const htmlWithNotice = config.testMode
    ? `${html}<hr style="border:none;border-top:1px solid #333;margin:24px 0" /><p style="color:#888;font-size:12px;">Test mode: this email was intended for <strong>${intendedTo.join(', ')}</strong> but delivered to ${config.testRecipient}.</p>`
    : html;

  try {
    const result = await resend.emails.send({
      from: config.from,
      to: actualTo,
      subject: subjectFinal,
      html: htmlWithNotice,
      text: text || undefined,
      reply_to: replyTo,
      tags,
    });

    if (result.error) {
      console.error('[email] Resend error:', result.error);
      return { ok: false, error: result.error, intendedTo, actualTo, testMode: config.testMode };
    }

    return {
      ok: true,
      id: result.data?.id,
      intendedTo,
      actualTo,
      testMode: config.testMode,
    };
  } catch (err) {
    console.error('[email] Send failed:', err);
    return { ok: false, error: err.message, intendedTo, actualTo, testMode: config.testMode };
  }
}
