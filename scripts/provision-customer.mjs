/**
 * Provision a customer: Firebase Auth user + annual EC2 order + invoice + active service with SSH creds.
 *
 * Usage:
 *   node --env-file=.env.local scripts/provision-customer.mjs
 *   node --env-file=.env.local scripts/provision-customer.mjs --email=user@example.com --password='secret' --ip=1.2.3.4
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

function getArg(name, fallback) {
  const prefix = `--${name}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

const CONFIG = {
  email: getArg('email', 'gayathricctv@gmail.com'),
  password: getArg('password', 'novascript2025V#'),
  name: getArg('name', 'Gayathri CCTV'),
  ip: getArg('ip', '67.217.62.194'),
  sshPassword: getArg('ssh-password', getArg('password', 'novascript2025V#')),
  sshUser: getArg('ssh-user', 'root'),
  sshPort: getArg('ssh-port', '22'),
  packageId: getArg('package', 'starter-ec2'),
  billingCycle: 'annual',
  issueDate: new Date(getArg('issue-date', '2026-06-27')),
  renewalDate: new Date(getArg('renewal-date', '2027-06-27')),
  subtotal: Number(getArg('subtotal', '190')),
  tax: Number(getArg('tax', '13.5')),
  total: Number(getArg('total', '203.5')),
};

const EC2_PACKAGES = {
  'starter-ec2': {
    id: 'starter-ec2',
    name: 'Starter EC2',
    monthlyPrice: 19,
    vcpu: 1,
    ram: '2 GB',
    storage: '40 GB NVMe',
    bandwidth: '2 TB',
  },
  'business-ec2': {
    id: 'business-ec2',
    name: 'Business EC2',
    monthlyPrice: 35,
    vcpu: 2,
    ram: '4 GB',
    storage: '80 GB NVMe',
    bandwidth: '4 TB',
  },
};

function loadServiceAccount() {
  const accountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 'firebase-service-account.json';
  const resolved = path.resolve(ROOT, accountPath);
  if (fs.existsSync(resolved)) {
    return JSON.parse(fs.readFileSync(resolved, 'utf8'));
  }
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  }
  throw new Error('Firebase service account not found. Set FIREBASE_SERVICE_ACCOUNT_PATH in .env.local');
}

function initFirebase() {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({
    credential: cert(loadServiceAccount()),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

function generateInvoiceNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 900000 + 100000);
  return `INV-${year}${month}-${random}`;
}

function defaultOnDemandUsage() {
  return {
    enabled: false,
    enabledAt: null,
    enabledBy: null,
    adminLocked: false,
    customRates: null,
    notes: '',
  };
}

async function getOrCreateAuthUser(auth, { email, password, name }) {
  try {
    const created = await auth.createUser({
      email,
      password,
      displayName: name,
      emailVerified: false,
    });
    console.log(`✓ Created Firebase Auth user: ${created.uid}`);
    return created;
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      const existing = await auth.getUserByEmail(email);
      console.log(`• Auth user already exists: ${existing.uid}`);
      await auth.updateUser(existing.uid, { password, displayName: name });
      console.log('✓ Updated password and display name');
      return existing;
    }
    throw err;
  }
}

async function ensureUserDocument(db, uid, { name, email }) {
  const ref = db.collection('users').doc(uid);
  const snap = await ref.get();
  if (snap.exists) {
    await ref.set({ name, email, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    console.log('✓ Updated Firestore user profile');
    return;
  }
  await ref.set({
    uid,
    name,
    email,
    role: 'user',
    createdAt: FieldValue.serverTimestamp(),
  });
  console.log('✓ Created Firestore user profile');
}

async function main() {
  const pkg = EC2_PACKAGES[CONFIG.packageId];
  if (!pkg) {
    throw new Error(`Unknown package: ${CONFIG.packageId}`);
  }

  console.log('\nFeed Forge — Customer Provisioning');
  console.log('==================================');
  console.log(`Email:    ${CONFIG.email}`);
  console.log(`Package:  ${pkg.name} (${CONFIG.billingCycle})`);
  console.log(`Total:    $${CONFIG.total.toFixed(2)} USD`);
  console.log(`Server:   ${CONFIG.ip}`);
  console.log(`Renewal:  ${CONFIG.renewalDate.toISOString().slice(0, 10)}\n`);

  initFirebase();
  const auth = getAuth();
  const db = getFirestore();

  const authUser = await getOrCreateAuthUser(auth, CONFIG);
  const uid = authUser.uid;
  await ensureUserDocument(db, uid, CONFIG);

  const cartItem = {
    type: 'ec2',
    packageId: pkg.id,
    name: pkg.name,
    price: pkg.monthlyPrice,
    quantity: 1,
    billingCycle: CONFIG.billingCycle,
    config: {
      os: 'Ubuntu 22.04 LTS',
      location: 'us-east',
      vcpu: pkg.vcpu,
      ram: pkg.ram,
      storage: pkg.storage,
      bandwidth: pkg.bandwidth,
    },
  };

  const orderRef = await db.collection('orders').add({
    userId: uid,
    items: [cartItem],
    subtotal: CONFIG.subtotal,
    tax: CONFIG.tax,
    discount: 0,
    total: CONFIG.total,
    billingCycle: CONFIG.billingCycle,
    currency: 'USD',
    customer: {
      name: CONFIG.name,
      email: CONFIG.email,
      countryCode: 'LK',
      country: 'Sri Lanka',
    },
    countryCode: 'LK',
    country: 'Sri Lanka',
    paymentGateway: 'manual',
    paymentGatewayName: 'Manual',
    paymentGatewayLabel: 'Manual / Admin',
    status: 'payment_confirmed',
    paymentReference: `MANUAL-${Date.now()}`,
    paidAt: Timestamp.fromDate(CONFIG.issueDate),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  const orderId = orderRef.id;
  console.log(`✓ Order created: ${orderId}`);

  await db.collection('orderItems').add({
    orderId,
    userId: uid,
    ...cartItem,
    createdAt: FieldValue.serverTimestamp(),
  });

  const paymentRef = `MANUAL-${Date.now()}`;
  await db.collection('payments').add({
    userId: uid,
    orderId,
    gateway: 'manual',
    gatewayName: 'Manual',
    amount: CONFIG.total,
    currency: 'USD',
    status: 'completed',
    reference: paymentRef,
    countryCode: 'LK',
    country: 'Sri Lanka',
    testMode: false,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  console.log('✓ Payment record created');

  const invoiceNumber = generateInvoiceNumber();
  const invoiceRef = await db.collection('invoices').add({
    invoiceNumber,
    userId: uid,
    orderId,
    serviceId: null,
    invoiceType: 'order',
    lineItems: [
      {
        name: `${pkg.name} — Annual Subscription`,
        amount: CONFIG.subtotal,
      },
    ],
    subtotal: CONFIG.subtotal,
    tax: CONFIG.tax,
    discount: 0,
    total: CONFIG.total,
    currency: 'USD',
    status: 'paid',
    issueDate: Timestamp.fromDate(CONFIG.issueDate),
    dueDate: Timestamp.fromDate(CONFIG.issueDate),
    paidDate: Timestamp.fromDate(CONFIG.issueDate),
    billingPeriodStart: Timestamp.fromDate(CONFIG.issueDate),
    billingPeriodEnd: Timestamp.fromDate(CONFIG.renewalDate),
    paymentReference: paymentRef,
    notes: 'Provisioned via admin script',
    createdAt: FieldValue.serverTimestamp(),
  });
  console.log(`✓ Invoice created: ${invoiceNumber} (${invoiceRef.id})`);

  const credentials = {
    ip: CONFIG.ip,
    username: CONFIG.sshUser,
    password: CONFIG.sshPassword,
    sshPort: CONFIG.sshPort,
    os: 'Ubuntu 22.04 LTS',
    location: 'us-east',
    notes: 'Provisioned via admin script',
  };

  const serviceRef = await db.collection('services').add({
    userId: uid,
    orderId,
    name: pkg.name,
    type: 'ec2',
    packageId: pkg.id,
    status: 'active',
    billingStatus: 'active',
    billingCycle: CONFIG.billingCycle,
    config: cartItem.config,
    credentials,
    onDemandUsage: defaultOnDemandUsage(),
    nextRenewalDate: Timestamp.fromDate(CONFIG.renewalDate),
    activatedAt: Timestamp.fromDate(CONFIG.issueDate),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  const serviceId = serviceRef.id;

  await invoiceRef.update({ serviceId });
  console.log(`✓ Service created & activated: ${serviceId}`);

  await db.collection('adminLogs').add({
    adminId: 'script:provision-customer',
    action: 'provision_customer',
    details: {
      uid,
      email: CONFIG.email,
      orderId,
      serviceId,
      invoiceNumber,
      ip: CONFIG.ip,
    },
    createdAt: FieldValue.serverTimestamp(),
  });

  console.log('\n==================================');
  console.log('DONE — Customer can log in at:');
  console.log('  https://feedforge.cloud/login');
  console.log(`  Email:    ${CONFIG.email}`);
  console.log(`  Password: (as provided)`);
  console.log('\nDashboard service:');
  console.log(`  https://feedforge.cloud/dashboard/services/${serviceId}`);
  console.log(`  IP:       ${CONFIG.ip}`);
  console.log(`  SSH user: ${CONFIG.sshUser}`);
  console.log(`  Renewal:  ${CONFIG.renewalDate.toISOString().slice(0, 10)}`);
  console.log('==================================\n');
}

main().catch((err) => {
  console.error('\nProvisioning failed:', err.message || err);
  process.exit(1);
});
