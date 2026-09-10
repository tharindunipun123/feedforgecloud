import { getEmailConfig } from './config.js';

function fmtCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount || 0);
}

function fmtDate(value) {
  if (!value) return '—';
  const d = value?.toDate ? value.toDate() : new Date(value);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function layout({ title, bodyHtml, ctaLabel, ctaUrl }) {
  const { brandName, appUrl, domain } = getEmailConfig();
  const ctaBlock = ctaLabel && ctaUrl
    ? `<p style="margin:28px 0;"><a href="${ctaUrl}" style="display:inline-block;background:#fff;color:#000;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">${ctaLabel}</a></p>`
    : '';

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#111;border:1px solid #262626;border-radius:16px;padding:32px;">
        <tr><td>
          <p style="margin:0 0 8px;color:#fff;font-size:20px;font-weight:700;">${brandName}</p>
          <p style="margin:0 0 24px;color:#737373;font-size:13px;">${domain}</p>
          <h1 style="margin:0 0 16px;color:#fff;font-size:22px;line-height:1.3;">${title}</h1>
          <div style="color:#d4d4d4;font-size:15px;line-height:1.6;">${bodyHtml}</div>
          ${ctaBlock}
          <p style="margin:32px 0 0;color:#525252;font-size:12px;line-height:1.5;">
            Questions? Visit <a href="${appUrl}/dashboard/support" style="color:#a3a3a3;">support</a> or reply to this email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function purchaseConfirmationTemplate({ customerName, orderId, items, subtotal, tax, total, currency, invoiceNumber }) {
  const { appUrl } = getEmailConfig();
  const itemRows = (items || [])
    .map((item) => `<li style="margin-bottom:6px;">${item.name || item.description} — ${fmtCurrency(item.price || item.amount, currency)}</li>`)
    .join('');

  const bodyHtml = `
    <p>Hi ${customerName || 'there'},</p>
    <p>Thank you for your purchase on Feed Forge. Your payment was received and your services are being set up.</p>
    <p><strong>Order ID:</strong> ${orderId}<br/>
    ${invoiceNumber ? `<strong>Invoice:</strong> ${invoiceNumber}<br/>` : ''}
    <strong>Total paid:</strong> ${fmtCurrency(total, currency)}</p>
    <ul style="padding-left:20px;margin:16px 0;">${itemRows}</ul>
    <p style="color:#a3a3a3;font-size:14px;">Subtotal ${fmtCurrency(subtotal, currency)} · Tax ${fmtCurrency(tax, currency)}</p>
    <p>Services appear in your dashboard with a pending status while provisioning completes (usually 10–15 minutes).</p>
  `;

  return {
    subject: `Payment confirmed — ${fmtCurrency(total, currency)}`,
    html: layout({
      title: 'Payment confirmed',
      bodyHtml,
      ctaLabel: 'View dashboard',
      ctaUrl: `${appUrl}/dashboard/services`,
    }),
  };
}

export function renewalDueTemplate({
  customerName,
  serviceName,
  expiryDate,
  invoiceNumber,
  total,
  currency,
  invoiceId,
}) {
  const { appUrl } = getEmailConfig();
  const bodyHtml = `
    <p>Hi ${customerName || 'there'},</p>
    <p>Your service <strong>${serviceName}</strong> ${expiryDate ? `expires on <strong>${expiryDate}</strong>` : 'requires renewal'}.</p>
    <p>Please pay your renewal invoice to keep the service active:</p>
    <p><strong>Invoice:</strong> ${invoiceNumber}<br/>
    <strong>Amount due:</strong> ${fmtCurrency(total, currency)}</p>
    <p style="color:#fca5a5;font-size:14px;">Unpaid renewals may lead to service suspension.</p>
  `;

  return {
    subject: `Renewal due — ${serviceName} (${fmtCurrency(total, currency)})`,
    html: layout({
      title: 'Service renewal payment required',
      bodyHtml,
      ctaLabel: `Pay ${fmtCurrency(total, currency)}`,
      ctaUrl: `${appUrl}/dashboard/invoices/${invoiceId}`,
    }),
  };
}

export function renewalPaidTemplate({
  customerName,
  serviceName,
  invoiceNumber,
  total,
  currency,
  nextRenewalDate,
  invoiceId,
}) {
  const { appUrl } = getEmailConfig();
  const bodyHtml = `
    <p>Hi ${customerName || 'there'},</p>
    <p>Your renewal payment for <strong>${serviceName}</strong> was successful.</p>
    <p><strong>Invoice:</strong> ${invoiceNumber}<br/>
    <strong>Amount paid:</strong> ${fmtCurrency(total, currency)}<br/>
    ${nextRenewalDate ? `<strong>Next renewal:</strong> ${nextRenewalDate}</p>` : '</p>'}
    <p>Your service remains active. Thank you for continuing with Feed Forge.</p>
  `;

  return {
    subject: `Renewal confirmed — ${serviceName}`,
    html: layout({
      title: 'Renewal payment received',
      bodyHtml,
      ctaLabel: 'View service',
      ctaUrl: `${appUrl}/dashboard/invoices/${invoiceId}`,
    }),
  };
}

export { fmtCurrency, fmtDate };
