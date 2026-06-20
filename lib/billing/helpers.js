export function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addMonths(date, months) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function addYears(date, years) {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

export function isPastDue(dueDate, status) {
  if (status === 'paid' || status === 'cancelled' || status === 'refunded') {
    return false;
  }
  if (!dueDate) return false;
  const due = dueDate?.toDate ? dueDate.toDate() : new Date(dueDate);
  return new Date() > due && status === 'unpaid';
}

export function getDaysOverdue(dueDate, status) {
  if (!isPastDue(dueDate, status)) return 0;
  const due = dueDate?.toDate ? dueDate.toDate() : new Date(dueDate);
  const diff = new Date() - due;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function calculateNextRenewalDate(activationDate, billingCycle, previousRenewalDate) {
  const base = previousRenewalDate
    ? previousRenewalDate?.toDate
      ? previousRenewalDate.toDate()
      : new Date(previousRenewalDate)
    : activationDate?.toDate
      ? activationDate.toDate()
      : new Date(activationDate);

  if (billingCycle === 'annual') {
    return addYears(base, 1);
  }
  return addMonths(base, 1);
}

export function generateInvoiceNumber(prefix = 'INV') {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 900000 + 100000);
  return `${prefix}-${year}${month}-${random}`;
}

export function formatBillingDate(date) {
  if (!date) return '—';
  const d = date?.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount || 0);
}

export const DEFAULT_PAYMENT_TERMS_DAYS = 7;

export function calculateDueDate(issueDate, termsDays = DEFAULT_PAYMENT_TERMS_DAYS) {
  const issue = issueDate?.toDate ? issueDate.toDate() : new Date(issueDate || Date.now());
  return addDays(issue, termsDays);
}

export function calculateTax(subtotal, taxRate = 0) {
  return subtotal * taxRate;
}

export function calculateTotal(subtotal, tax = 0, discount = 0) {
  return Math.max(0, subtotal + tax - discount);
}
