/**
 * Fix Leo House billing: monthly Pro EC2 + Starter Broadcast, expired Sep 10 2026.
 * Usage: node --env-file=.env.local scripts/setup-leo-renewals.mjs
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const EMAIL = 'leohousetechnology@gmail.com';

/** Purchased Aug 10 → renewal due Sep 10 (expired yesterday when today is Sep 11). */
const PURCHASED_AT = new Date('2026-08-10T12:00:00.000Z');
const EXPIRY_DATE = new Date('2026-09-10T12:00:00.000Z');

const RENEWAL_SERVICES = [
  {
    id: 'bxNmWwsSuaNgNa1N8u3M',
    name: 'Pro EC2',
    packageId: 'pro-ec2',
    type: 'ec2',
    billingCycle: 'monthly',
    subtotal: 55,
    tax: 3.5,
    lineName: 'Pro EC2 — Monthly Renewal',
    invoiceNumber: 'INV-202609-149879',
  },
  {
    id: '1AuyHI1S8z51u4OgsfsJ',
    name: 'Starter Broadcast',
    packageId: 'stream-starter',
    type: 'live_streaming',
    billingCycle: 'monthly',
    subtotal: 165,
    tax: 3.5,
    lineName: 'Starter Broadcast — Monthly Renewal',
    invoiceNumber: 'INV-202609-679676',
  },
];

function loadServiceAccount() {
  const accountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 'firebase-service-account.json';
  return JSON.parse(fs.readFileSync(path.resolve(ROOT, accountPath), 'utf8'));
}

function initFirebase() {
  if (getApps().length > 0) return;
  initializeApp({ credential: cert(loadServiceAccount()) });
}

async function main() {
  initFirebase();
  const auth = getAuth();
  const db = getFirestore();
  const user = await auth.getUserByEmail(EMAIL);
  const uid = user.uid;

  const purchasedTs = Timestamp.fromDate(PURCHASED_AT);
  const expiryTs = Timestamp.fromDate(EXPIRY_DATE);

  console.log(`Fixing billing for ${EMAIL} (${uid})`);
  console.log(`Purchased: ${PURCHASED_AT.toISOString().slice(0, 10)}`);
  console.log(`Expired:   ${EXPIRY_DATE.toISOString().slice(0, 10)} (yesterday)\n`);

  for (const spec of RENEWAL_SERVICES) {
    const serviceRef = db.collection('services').doc(spec.id);
    const serviceSnap = await serviceRef.get();
    if (!serviceSnap.exists) {
      console.warn(`⚠ Service not found: ${spec.name} (${spec.id})`);
      continue;
    }
    if (serviceSnap.data().userId !== uid) {
      console.warn(`⚠ Service ${spec.id} does not belong to ${EMAIL}`);
      continue;
    }

    const total = spec.subtotal + spec.tax;

    const existingUnpaid = await db.collection('invoices')
      .where('userId', '==', uid)
      .where('serviceId', '==', spec.id)
      .where('status', '==', 'unpaid')
      .where('invoiceType', '==', 'renewal')
      .limit(1)
      .get();

    let invoiceId;

    if (!existingUnpaid.empty) {
      invoiceId = existingUnpaid.docs[0].id;
      const inv = existingUnpaid.docs[0].data();
      await existingUnpaid.docs[0].ref.update({
        invoiceNumber: spec.invoiceNumber || inv.invoiceNumber,
        lineItems: [{ name: spec.lineName, amount: spec.subtotal }],
        subtotal: spec.subtotal,
        tax: spec.tax,
        total,
        dueDate: expiryTs,
        billingPeriodStart: purchasedTs,
        billingPeriodEnd: expiryTs,
        renewalDueEmailSentAt: FieldValue.delete(),
        notes: 'Monthly renewal — payment required. Service expired Sep 10, 2026.',
        updatedAt: FieldValue.serverTimestamp(),
      });
      console.log(`↻ Updated invoice ${spec.invoiceNumber || inv.invoiceNumber} (${invoiceId}) — $${total.toFixed(2)}`);
    } else {
      const invoiceRef = await db.collection('invoices').add({
        invoiceNumber: spec.invoiceNumber,
        userId: uid,
        orderId: null,
        serviceId: spec.id,
        invoiceType: 'renewal',
        lineItems: [{ name: spec.lineName, amount: spec.subtotal }],
        subtotal: spec.subtotal,
        tax: spec.tax,
        discount: 0,
        total,
        currency: 'USD',
        status: 'unpaid',
        issueDate: Timestamp.fromDate(EXPIRY_DATE),
        dueDate: expiryTs,
        paidDate: null,
        billingPeriodStart: purchasedTs,
        billingPeriodEnd: expiryTs,
        paymentReference: null,
        notes: 'Monthly renewal — payment required. Service expired Sep 10, 2026.',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      invoiceId = invoiceRef.id;
      console.log(`✓ Created invoice ${spec.invoiceNumber} (${invoiceId}) — $${total.toFixed(2)}`);
    }

    await serviceRef.update({
      name: spec.name,
      packageId: spec.packageId,
      type: spec.type,
      billingCycle: spec.billingCycle,
      createdAt: purchasedTs,
      activatedAt: purchasedTs,
      nextRenewalDate: expiryTs,
      billingStatus: 'renewal_due',
      renewalInvoiceId: invoiceId,
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log(`✓ ${spec.name}: monthly · purchased Aug 10 · expired Sep 10 · $${total.toFixed(2)} due\n`);
  }

  console.log('Done.');
  console.log('  • Pro EC2 — $58.50/month (monthly renewal)');
  console.log('  • Starter Broadcast — $168.50/month');
  console.log('  Both expired yesterday (Sep 10). Today is Sep 11.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
