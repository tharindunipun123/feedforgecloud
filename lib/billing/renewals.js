import { EC2_PACKAGES, BILLING_CYCLES } from '@/data/constants';
import { STREAMING_PACKAGES } from '@/data/streaming';
import { SSL_PACKAGES } from '@/data/ssl-certificates';
import { CDN_PLANS } from '@/data/cdn';
import { CHECKOUT_TAX_PER_PACKAGE } from '@/lib/billing/helpers';

const PACKAGE_CATALOG = [
  ...EC2_PACKAGES,
  ...STREAMING_PACKAGES,
  ...SSL_PACKAGES,
  ...CDN_PLANS,
  ...[
    { id: 'n8n-starter', name: 'n8n Starter', type: 'n8n', monthlyPrice: 14.99, renewalPrice: 14.99 },
    { id: 'n8n-pro', name: 'n8n Pro', type: 'n8n', monthlyPrice: 29.99, renewalPrice: 29.99 },
    { id: 'ai-website-pro', name: 'AI Website Pro', type: 'ai-website', monthlyPrice: 24.99, renewalPrice: 24.99 },
    { id: 'ai-chatbot-business', name: 'AI Chatbot Business', type: 'ai-chatbot', monthlyPrice: 49.99, renewalPrice: 49.99 },
  ],
];

export function getPackageForService(service) {
  return PACKAGE_CATALOG.find((p) => p.id === service.packageId && p.type === service.type)
    || PACKAGE_CATALOG.find((p) => p.id === service.packageId);
}

export function getRenewalSubtotal(service) {
  const pkg = getPackageForService(service);
  const cycle = service.billingCycle || 'monthly';
  if (!pkg) return 0;

  if (service.type === 'ssl_certificate' || pkg.annualOnly) {
    return pkg.annualPrice || pkg.renewalPrice || pkg.monthlyPrice || 0;
  }

  if (cycle === 'annual') {
    const basePrice = pkg.monthlyPrice ?? pkg.renewalPrice ?? 0;
    const multiplier = BILLING_CYCLES.find((b) => b.id === 'annual')?.multiplier || 10;
    return basePrice * multiplier;
  }
  return pkg.monthlyPrice ?? pkg.renewalPrice ?? 0;
}

export function buildRenewalInvoiceAmounts(service) {
  const subtotal = getRenewalSubtotal(service);
  const tax = CHECKOUT_TAX_PER_PACKAGE;
  return {
    subtotal,
    tax,
    total: subtotal + tax,
    lineItems: [
      {
        name: `${service.name} — ${service.billingCycle === 'annual' ? 'Annual' : 'Monthly'} Renewal`,
        amount: subtotal,
      },
    ],
  };
}

function toDate(value) {
  if (!value) return null;
  if (value?.toDate) return value.toDate();
  if (value?.seconds) return new Date(value.seconds * 1000);
  return new Date(value);
}

export function isRenewalDue(service, now = new Date()) {
  const renewalDate = toDate(service.nextRenewalDate);
  if (!renewalDate) return false;
  const endOfRenewalDay = new Date(renewalDate);
  endOfRenewalDay.setHours(23, 59, 59, 999);
  return now >= renewalDate && service.status !== 'cancelled';
}

export function isRenewalDueToday(service, now = new Date()) {
  const renewalDate = toDate(service.nextRenewalDate);
  if (!renewalDate) return false;
  return (
    renewalDate.getFullYear() === now.getFullYear()
    && renewalDate.getMonth() === now.getMonth()
    && renewalDate.getDate() === now.getDate()
  );
}

function isSameCalendarDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
  );
}

export function isRenewalExpiredYesterday(service, now = new Date()) {
  const renewalDate = toDate(service.nextRenewalDate);
  if (!renewalDate) return false;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameCalendarDay(renewalDate, yesterday);
}

export function getRenewalUrgencyLabel(service, now = new Date()) {
  if (service.billingStatus === 'renewal_due' || isRenewalDue(service, now)) {
    if (isRenewalDueToday(service, now)) return 'Expires today';
    if (isRenewalExpiredYesterday(service, now)) return 'Expired yesterday';
    return 'Renewal overdue';
  }
  return null;
}
