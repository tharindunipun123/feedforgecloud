import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAdminDb, initAdminApp } from '@/lib/firebase/admin';
import { generateInvoiceNumber } from '@/lib/billing/helpers';
import { buildRenewalInvoiceAmounts, isRenewalDue } from '@/lib/billing/renewals';
import { sendRenewalDueEmail } from '@/lib/email/notifications';

function getDb() {
  initAdminApp();
  const db = getAdminDb();
  if (!db) throw new Error('Firebase Admin is not configured.');
  return db;
}

async function ensureRenewalInvoice(db, service) {
  const existing = await db.collection('invoices')
    .where('userId', '==', service.userId)
    .where('serviceId', '==', service.id)
    .where('status', '==', 'unpaid')
    .where('invoiceType', '==', 'renewal')
    .limit(1)
    .get();

  if (!existing.empty) {
    const doc = existing.docs[0];
    return { invoiceId: doc.id, invoice: doc.data(), created: false };
  }

  const amounts = buildRenewalInvoiceAmounts(service);
  const renewalDate = service.nextRenewalDate?.toDate
    ? service.nextRenewalDate.toDate()
    : service.nextRenewalDate
      ? new Date(service.nextRenewalDate)
      : new Date();

  const invoiceRef = await db.collection('invoices').add({
    invoiceNumber: generateInvoiceNumber(),
    userId: service.userId,
    orderId: null,
    serviceId: service.id,
    invoiceType: 'renewal',
    lineItems: amounts.lineItems,
    subtotal: amounts.subtotal,
    tax: amounts.tax,
    discount: 0,
    total: amounts.total,
    currency: 'USD',
    status: 'unpaid',
    issueDate: FieldValue.serverTimestamp(),
    dueDate: Timestamp.fromDate(renewalDate),
    paidDate: null,
    billingPeriodStart: Timestamp.fromDate(renewalDate),
    billingPeriodEnd: null,
    paymentReference: null,
    notes: 'Service renewal — payment required to extend service.',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await db.collection('services').doc(service.id).update({
    billingStatus: 'renewal_due',
    renewalInvoiceId: invoiceRef.id,
    updatedAt: FieldValue.serverTimestamp(),
  });

  const invoiceSnap = await invoiceRef.get();
  return { invoiceId: invoiceRef.id, invoice: invoiceSnap.data(), created: true };
}

/**
 * Scan active services, create renewal invoices when due, and send expiration emails.
 */
export async function processRenewalReminders({ sendEmails = true } = {}) {
  const db = getDb();
  const [activeSnap, renewalDueSnap] = await Promise.all([
    db.collection('services').where('status', '==', 'active').get(),
    db.collection('services').where('billingStatus', '==', 'renewal_due').get(),
  ]);

  const serviceMap = new Map();
  for (const doc of activeSnap.docs) serviceMap.set(doc.id, { id: doc.id, ...doc.data() });
  for (const doc of renewalDueSnap.docs) serviceMap.set(doc.id, { id: doc.id, ...doc.data() });

  const results = {
    scanned: serviceMap.size,
    due: 0,
    invoicesCreated: 0,
    emailsSent: 0,
    emailsSkipped: 0,
    errors: [],
  };

  for (const service of serviceMap.values()) {
    if (service.status === 'cancelled') continue;
    if (!isRenewalDue(service)) continue;

    results.due += 1;

    try {
      const { invoiceId, invoice, created } = await ensureRenewalInvoice(db, service);
      if (created) results.invoicesCreated += 1;

      if (!sendEmails) continue;

      const emailResult = await sendRenewalDueEmail({
        invoiceId,
        invoice: { ...invoice, invoiceNumber: invoice.invoiceNumber },
        service,
      });

      if (emailResult.ok) results.emailsSent += 1;
      else if (emailResult.skipped) results.emailsSkipped += 1;
    } catch (err) {
      results.errors.push({ serviceId: service.id, message: err.message });
    }
  }

  return results;
}

/** Send renewal-due emails for unpaid renewal invoices that have not been emailed yet. */
export async function sendPendingRenewalEmails() {
  const db = getDb();
  const snap = await db.collection('invoices')
    .where('status', '==', 'unpaid')
    .where('invoiceType', '==', 'renewal')
    .get();

  const results = { scanned: snap.size, sent: 0, skipped: 0, errors: [] };

  for (const doc of snap.docs) {
    const invoice = doc.data();
    if (invoice.renewalDueEmailSentAt) {
      results.skipped += 1;
      continue;
    }

    try {
      let service = null;
      if (invoice.serviceId) {
        const serviceSnap = await db.collection('services').doc(invoice.serviceId).get();
        if (serviceSnap.exists) service = { id: serviceSnap.id, ...serviceSnap.data() };
      }

      const emailResult = await sendRenewalDueEmail({
        invoiceId: doc.id,
        invoice,
        service,
      });

      if (emailResult.ok) results.sent += 1;
      else results.skipped += 1;
    } catch (err) {
      results.errors.push({ invoiceId: doc.id, message: err.message });
    }
  }

  return results;
}
