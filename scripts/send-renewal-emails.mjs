/**
 * Send renewal-due emails for unpaid renewal invoices not yet emailed.
 * Usage: node --env-file=.env.local scripts/send-renewal-emails.mjs
 */
import { initAdminApp, getAdminDb } from '../lib/firebase/admin.js';
import { sendRenewalDueEmail } from '../lib/email/notifications.js';

async function main() {
  initAdminApp();
  const db = getAdminDb();
  if (!db) throw new Error('Firebase Admin not configured.');

  const snap = await db.collection('invoices')
    .where('status', '==', 'unpaid')
    .where('invoiceType', '==', 'renewal')
    .get();

  console.log(`Found ${snap.size} unpaid renewal invoice(s)\n`);

  let sent = 0;
  let skipped = 0;

  for (const doc of snap.docs) {
    const invoice = doc.data();
    if (invoice.renewalDueEmailSentAt) {
      console.log(`↷ Skip ${invoice.invoiceNumber} — already emailed`);
      skipped += 1;
      continue;
    }

    let service = null;
    if (invoice.serviceId) {
      const serviceSnap = await db.collection('services').doc(invoice.serviceId).get();
      if (serviceSnap.exists) service = { id: serviceSnap.id, ...serviceSnap.data() };
    }

    const result = await sendRenewalDueEmail({
      invoiceId: doc.id,
      invoice,
      service,
    });

    if (result.ok) {
      console.log(`✓ Sent renewal email for ${invoice.invoiceNumber} → ${result.actualTo?.join(', ')} (intended: ${result.intendedTo?.join(', ')})`);
      sent += 1;
    } else if (result.skipped) {
      console.log(`↷ Skipped ${invoice.invoiceNumber}: ${result.reason || 'unknown'}`);
      skipped += 1;
    } else {
      console.error(`✗ Failed ${invoice.invoiceNumber}:`, result.error);
    }
  }

  console.log(`\nDone. Sent: ${sent}, Skipped: ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
