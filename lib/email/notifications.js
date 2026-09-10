import { FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminDb, initAdminApp } from '../firebase/admin.js';
import { sendEmail } from './resend.js';
import {
  purchaseConfirmationTemplate,
  renewalDueTemplate,
  renewalPaidTemplate,
  fmtDate,
} from './templates.js';

function getDb() {
  initAdminApp();
  const db = getAdminDb();
  if (!db) throw new Error('Firebase Admin is not configured.');
  return db;
}

export async function getUserContact(userId) {
  const db = getDb();
  const userDoc = await db.collection('users').doc(userId).get();
  const profile = userDoc.exists ? userDoc.data() : {};

  let email = profile.email || null;
  if (!email) {
    try {
      const authUser = await getAuth().getUser(userId);
      email = authUser.email || null;
    } catch {
      email = null;
    }
  }

  return {
    email,
    name: profile.name || profile.displayName || '',
  };
}

async function wasEmailSent(type, referenceId) {
  const db = getDb();
  const snap = await db.collection('emailLogs')
    .where('type', '==', type)
    .where('referenceId', '==', referenceId)
    .limit(1)
    .get();
  return !snap.empty;
}

async function logEmailSent({ type, referenceId, userId, intendedTo, result, meta = {} }) {
  const db = getDb();
  await db.collection('emailLogs').add({
    type,
    referenceId,
    userId: userId || null,
    intendedTo: intendedTo || [],
    actualTo: result?.actualTo || [],
    resendId: result?.id || null,
    testMode: result?.testMode ?? false,
    ok: result?.ok ?? false,
    skipped: result?.skipped ?? false,
    error: result?.error || null,
    meta,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function sendPurchaseConfirmationEmail({ orderId, order, invoiceId }) {
  if (!orderId || !order) return { skipped: true };
  if (await wasEmailSent('purchase_confirmation', orderId)) {
    return { skipped: true, reason: 'already_sent' };
  }

  const contact = await getUserContact(order.userId);
  const recipient = order.customer?.email || contact.email;
  if (!recipient) return { skipped: true, reason: 'no_email' };

  let invoiceNumber = null;
  if (invoiceId) {
    const invSnap = await getDb().collection('invoices').doc(invoiceId).get();
    if (invSnap.exists) invoiceNumber = invSnap.data().invoiceNumber;
  }

  const { subject, html } = purchaseConfirmationTemplate({
    customerName: order.customer?.name || contact.name,
    orderId,
    items: order.items || [],
    subtotal: order.subtotal,
    tax: order.tax,
    total: order.total,
    currency: order.currency || 'USD',
    invoiceNumber,
  });

  const result = await sendEmail({
    to: recipient,
    subject,
    html,
    tags: [{ name: 'type', value: 'purchase_confirmation' }],
  });

  if (result.ok) {
    await getDb().collection('orders').doc(orderId).set(
      { purchaseEmailSentAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
  }

  await logEmailSent({
    type: 'purchase_confirmation',
    referenceId: orderId,
    userId: order.userId,
    intendedTo: [recipient],
    result,
    meta: { invoiceId, total: order.total },
  });

  return result;
}

export async function sendRenewalDueEmail({ invoiceId, invoice, service }) {
  if (!invoiceId || !invoice) return { skipped: true };
  const dedupeKey = `${invoiceId}`;
  if (await wasEmailSent('renewal_due', dedupeKey)) {
    return { skipped: true, reason: 'already_sent' };
  }

  const contact = await getUserContact(invoice.userId);
  if (!contact.email) return { skipped: true, reason: 'no_email' };

  const serviceName = service?.name || invoice.lineItems?.[0]?.name || 'Your service';
  const expiryDate = fmtDate(service?.nextRenewalDate || invoice.dueDate);

  const { subject, html } = renewalDueTemplate({
    customerName: contact.name,
    serviceName,
    expiryDate,
    invoiceNumber: invoice.invoiceNumber,
    total: invoice.total,
    currency: invoice.currency || 'USD',
    invoiceId,
  });

  const result = await sendEmail({
    to: contact.email,
    subject,
    html,
    tags: [{ name: 'type', value: 'renewal_due' }],
  });

  if (result.ok) {
    await getDb().collection('invoices').doc(invoiceId).set(
      { renewalDueEmailSentAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
    await getDb().collection('renewalReminders').add({
      userId: invoice.userId,
      serviceId: invoice.serviceId || null,
      invoiceId,
      type: 'renewal_due',
      sentAt: FieldValue.serverTimestamp(),
      recipient: contact.email,
      testMode: result.testMode ?? false,
    });
  }

  await logEmailSent({
    type: 'renewal_due',
    referenceId: dedupeKey,
    userId: invoice.userId,
    intendedTo: [contact.email],
    result,
    meta: { serviceId: invoice.serviceId, total: invoice.total },
  });

  return result;
}

export async function sendRenewalPaidEmail({ invoiceId, invoice, service }) {
  if (!invoiceId || !invoice) return { skipped: true };
  const dedupeKey = `${invoiceId}`;
  if (await wasEmailSent('renewal_paid', dedupeKey)) {
    return { skipped: true, reason: 'already_sent' };
  }

  const contact = await getUserContact(invoice.userId);
  if (!contact.email) return { skipped: true, reason: 'no_email' };

  const serviceName = service?.name || 'Your service';
  const { subject, html } = renewalPaidTemplate({
    customerName: contact.name,
    serviceName,
    invoiceNumber: invoice.invoiceNumber,
    total: invoice.total,
    currency: invoice.currency || 'USD',
    nextRenewalDate: fmtDate(service?.nextRenewalDate),
    invoiceId,
  });

  const result = await sendEmail({
    to: contact.email,
    subject,
    html,
    tags: [{ name: 'type', value: 'renewal_paid' }],
  });

  if (result.ok) {
    await getDb().collection('invoices').doc(invoiceId).set(
      { renewalPaidEmailSentAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
  }

  await logEmailSent({
    type: 'renewal_paid',
    referenceId: dedupeKey,
    userId: invoice.userId,
    intendedTo: [contact.email],
    result,
    meta: { serviceId: invoice.serviceId, total: invoice.total },
  });

  return result;
}

/** Fire-and-forget wrapper — never throws to caller. */
export function queuePurchaseConfirmationEmail(payload) {
  sendPurchaseConfirmationEmail(payload).catch((err) => {
    console.error('[email] purchase confirmation failed:', err);
  });
}

export function queueRenewalDueEmail(payload) {
  sendRenewalDueEmail(payload).catch((err) => {
    console.error('[email] renewal due failed:', err);
  });
}

export function queueRenewalPaidEmail(payload) {
  sendRenewalPaidEmail(payload).catch((err) => {
    console.error('[email] renewal paid failed:', err);
  });
}
