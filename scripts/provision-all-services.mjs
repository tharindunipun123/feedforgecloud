/**
 * Provision a customer with every active platform service type (demo credentials).
 *
 * Usage:
 *   node --env-file=.env.local scripts/provision-all-services.mjs
 *   node --env-file=.env.local scripts/provision-all-services.mjs --email=user@example.com --password='secret'
 *   node --env-file=.env.local scripts/provision-all-services.mjs --force
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

const hasFlag = (name) => process.argv.includes(`--${name}`);

const CONFIG = {
  email: getArg('email', 'leohousetechnology@gmail.com'),
  password: getArg('password', 'novascript2025V#'),
  name: getArg('name', 'Leo House Technology'),
  organizationName: getArg('org', 'Leo House Technology'),
  brNumber: getArg('br', 'PV00234567'),
  organizationAddress: getArg('org-address', 'Colombo, Sri Lanka'),
  ip: getArg('ip', '67.217.62.194'),
  sshPassword: getArg('ssh-password', getArg('password', 'novascript2025V#')),
  sshUser: getArg('ssh-user', 'root'),
  sshPort: getArg('ssh-port', '22'),
  domain: getArg('domain', 'feedforge.cloud'),
  force: hasFlag('force'),
  issueDate: new Date(getArg('issue-date', new Date().toISOString().slice(0, 10))),
};

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function addYears(date, years) {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

function computeNextResetDate(fromDate = new Date()) {
  const next = new Date(fromDate);
  next.setMonth(next.getMonth() + 1);
  next.setDate(1);
  next.setHours(0, 0, 0, 0);
  return next;
}

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

function buildServiceDefinitions() {
  const { ip, sshUser, sshPassword, sshPort, domain, organizationName, brNumber } = CONFIG;
  const sshCreds = {
    ip,
    username: sshUser,
    password: sshPassword,
    sshPort,
    os: 'Ubuntu 22.04 LTS',
    location: 'us-east',
    notes: 'Demo credentials — provisioned via admin script',
  };

  const sslExpiry = addYears(CONFIG.issueDate, 1).toISOString().slice(0, 10);

  return [
    {
      key: 'ec2',
      name: 'Starter EC2',
      type: 'ec2',
      packageId: 'starter-ec2',
      billingCycle: 'annual',
      renewalDate: addYears(CONFIG.issueDate, 1),
      price: 190,
      config: {
        os: 'Ubuntu 22.04 LTS',
        location: 'us-east',
        vcpu: 1,
        ram: '2 GB',
        storage: '40 GB NVMe',
        bandwidth: '2 TB',
      },
      credentials: sshCreds,
    },
    {
      key: 'live_streaming',
      name: 'Starter Broadcast',
      type: 'live_streaming',
      packageId: 'stream-starter',
      billingCycle: 'monthly',
      renewalDate: addMonths(CONFIG.issueDate, 1),
      price: 165,
      config: {
        region: 'us-east',
        organizationName,
        brNumber,
        payAsYouGo: true,
        maxListeners: 500,
        maxStreams: 1,
      },
      credentials: {
        streamUrl: `https://${domain}/live`,
        mountPoint: '/live',
        sourcePassword: 'stream_source_demo_2025',
        adminUrl: `https://${domain}:8443/admin`,
        adminPassword: 'stream_admin_demo_2025',
        serverIp: ip,
        region: 'us-east',
        notes: 'Icecast2 + Liquidsoap stack on shared demo node',
      },
      onDemandUsage: {
        ...defaultOnDemandUsage(),
        enabled: true,
        enabledAt: CONFIG.issueDate,
        enabledBy: 'checkout',
      },
    },
    {
      key: 'ssl_certificate',
      name: 'SSL Certificate',
      type: 'ssl_certificate',
      packageId: 'ssl-certificate',
      billingCycle: 'annual',
      renewalDate: addYears(CONFIG.issueDate, 1),
      price: 49,
      config: {
        domain,
        validation: 'Domain Validation (DV)',
        tempSsl: { status: 'active', provider: "Let's Encrypt" },
      },
      credentials: {
        domain,
        certificateUrl: `https://${domain}/ssl/demo-certificate.pem`,
        privateKeyUrl: `https://${domain}/ssl/demo-private.key`,
        caBundleUrl: `https://${domain}/ssl/demo-ca-bundle.pem`,
        issuedAt: CONFIG.issueDate.toISOString().slice(0, 10),
        expiresAt: sslExpiry,
        tempSsl: {
          certificateUrl: `https://${domain}/ssl/temp-certificate.pem`,
          expiresAt: addMonths(CONFIG.issueDate, 3).toISOString().slice(0, 10),
          provider: "Let's Encrypt",
        },
      },
    },
    {
      key: 'ssl_installation',
      name: 'SSL Installation & Setup',
      type: 'ssl_certificate',
      packageId: 'ssl-installation',
      billingCycle: 'annual',
      renewalDate: addYears(CONFIG.issueDate, 1),
      price: 60,
      config: { domain, validation: 'Full installation service' },
      credentials: {
        domain,
        certificateUrl: `https://${domain}/ssl/installation-certificate.pem`,
        issuedAt: CONFIG.issueDate.toISOString().slice(0, 10),
        expiresAt: sslExpiry,
        notes: 'Professional SSL installation completed on demo host',
      },
    },
    {
      key: 'ssl_cdn',
      name: 'Super Fast CDN With SSL',
      type: 'ssl_certificate',
      packageId: 'ssl-cdn-bundle',
      billingCycle: 'annual',
      renewalDate: addYears(CONFIG.issueDate, 1),
      price: 210,
      config: { domain, validation: 'CDN + SSL bundle', includesCdn: true },
      credentials: {
        domain: `cdn.${domain}`,
        certificateUrl: `https://cdn.${domain}/ssl/edge-certificate.pem`,
        issuedAt: CONFIG.issueDate.toISOString().slice(0, 10),
        expiresAt: sslExpiry,
        notes: 'CDN edge SSL bundle active',
      },
    },
    {
      key: 'n8n',
      name: 'n8n Pro',
      type: 'n8n',
      packageId: 'n8n-pro',
      billingCycle: 'monthly',
      renewalDate: addMonths(CONFIG.issueDate, 1),
      price: 29.99,
      config: { workflows: 50, executions: '25,000/mo' },
      credentials: {
        ...sshCreds,
        controlPanelUrl: `https://n8n.${domain}`,
        notes: 'n8n automation instance — login via control panel URL',
      },
    },
    {
      key: 'ai_website',
      name: 'AI Website Pro',
      type: 'ai-website',
      packageId: 'ai-website-pro',
      billingCycle: 'monthly',
      renewalDate: addMonths(CONFIG.issueDate, 1),
      price: 24.99,
      config: { pages: 20, generationsPerMonth: -1 },
      credentials: {
        controlPanelUrl: `https://${domain}/dashboard/ai-website`,
        notes: 'AI Website Builder Pro — create projects from your dashboard',
      },
    },
    {
      key: 'ai_chatbot',
      name: 'AI Chatbot Business',
      type: 'ai-chatbot',
      packageId: 'ai-chatbot-business',
      billingCycle: 'monthly',
      renewalDate: addMonths(CONFIG.issueDate, 1),
      price: 49.99,
      config: { messages: '10,000/mo' },
      credentials: {
        controlPanelUrl: `https://${domain}/dashboard/ai-chatbot`,
        embedCode: `<script src="https://${domain}/widget/chatbot.js" data-id="demo"></script>`,
        notes: 'Embed the widget on your site using the script below',
      },
    },
    {
      key: 'cdn_hosting',
      name: 'CDN Growth',
      type: 'cdn_hosting',
      packageId: 'cdn-growth',
      billingCycle: 'monthly',
      renewalDate: addMonths(CONFIG.issueDate, 1),
      price: 24.99,
      config: { planId: 'cdn-growth', storageCredits: 20480, bandwidthCredits: 51200 },
      credentials: {
        apiEndpoint: `https://${domain}/api/cdn`,
        apiKey: 'qscdn_demo_key_feedforge_2025',
        notes: 'Use the CDN dashboard to upload and manage media files',
      },
      cdnPlan: {
        id: 'cdn-growth',
        name: 'CDN Growth',
        storageCredits: 20480,
        bandwidthCredits: 51200,
        maxImageSizeMB: 25,
        maxVideoSizeMB: 500,
        allowedFileTypes: [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
          'image/svg+xml',
          'video/mp4',
          'video/webm',
          'application/pdf',
          'text/css',
          'application/javascript',
        ],
      },
    },
  ];
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

async function ensureUserDocument(db, uid) {
  const ref = db.collection('users').doc(uid);
  await ref.set(
    {
      uid,
      name: CONFIG.name,
      email: CONFIG.email,
      role: 'user',
      organizationName: CONFIG.organizationName,
      brNumber: CONFIG.brNumber,
      organizationAddress: CONFIG.organizationAddress,
      aiWebsitePlan: 'ai-website-pro',
      updatedAt: FieldValue.serverTimestamp(),
      ...(await ref.get().then((s) => (s.exists ? {} : { createdAt: FieldValue.serverTimestamp() }))),
    },
    { merge: true }
  );
  console.log('✓ Updated Firestore user profile (org + AI website plan)');
}

async function getExistingServiceKeys(db, uid) {
  const snap = await db.collection('services').where('userId', '==', uid).get();
  const keys = new Set();
  for (const doc of snap.docs) {
    const data = doc.data();
    const key = data.packageId ? `${data.type}:${data.packageId}` : data.type;
    keys.add(key);
  }
  return keys;
}

async function createCdnSubscription(db, userId, serviceId, orderId, plan) {
  const resetDate = computeNextResetDate(CONFIG.issueDate);
  const subRef = await db.collection('cdnSubscriptions').add({
    userId,
    serviceId,
    orderId,
    planId: plan.id,
    planName: plan.name,
    status: 'active',
    totalCredits: plan.storageCredits,
    usedCredits: 0,
    remainingCredits: plan.storageCredits,
    storageUsedMB: 0,
    bandwidthUsedMB: 0,
    bandwidthCredits: plan.bandwidthCredits,
    maxImageSizeMB: plan.maxImageSizeMB,
    maxVideoSizeMB: plan.maxVideoSizeMB,
    allowedFileTypes: plan.allowedFileTypes,
    monthlyResetDate: resetDate,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return subRef.id;
}

async function main() {
  const definitions = buildServiceDefinitions();

  console.log('\nFeed Forge — Provision All Services');
  console.log('====================================');
  console.log(`Email:  ${CONFIG.email}`);
  console.log(`Name:   ${CONFIG.name}`);
  console.log(`Org:    ${CONFIG.organizationName}`);
  console.log(`Server: ${CONFIG.ip}`);
  console.log(`Force:  ${CONFIG.force ? 'yes (re-provision all)' : 'no (skip existing)'}\n`);

  initFirebase();
  const auth = getAuth();
  const db = getFirestore();

  const authUser = await getOrCreateAuthUser(auth, CONFIG);
  const uid = authUser.uid;
  await ensureUserDocument(db, uid);

  const existingKeys = CONFIG.force ? new Set() : await getExistingServiceKeys(db, uid);
  const toProvision = definitions.filter((def) => {
    const key = `${def.type}:${def.packageId}`;
    if (existingKeys.has(key) || existingKeys.has(def.type)) {
      console.log(`• Skipping ${def.name} (${key}) — already provisioned`);
      return false;
    }
    return true;
  });

  if (toProvision.length === 0) {
    console.log('\nNo new services to provision. Use --force to recreate.');
    return;
  }

  const subtotal = toProvision.reduce((sum, d) => sum + d.price, 0);
  const tax = toProvision.length * 3.5;
  const total = subtotal + tax;
  const renewalDate = addYears(CONFIG.issueDate, 1);

  const cartItems = toProvision.map((def) => ({
    type: def.type,
    packageId: def.packageId,
    name: def.name,
    price: def.price,
    quantity: 1,
    billingCycle: def.billingCycle,
    config: def.config,
  }));

  const orderRef = await db.collection('orders').add({
    userId: uid,
    items: cartItems,
    subtotal,
    tax,
    discount: 0,
    total,
    billingCycle: 'mixed',
    currency: 'USD',
    customer: {
      name: CONFIG.name,
      email: CONFIG.email,
      organizationName: CONFIG.organizationName,
      brNumber: CONFIG.brNumber,
      organizationAddress: CONFIG.organizationAddress,
      countryCode: 'LK',
      country: 'Sri Lanka',
    },
    countryCode: 'LK',
    country: 'Sri Lanka',
    paymentGateway: 'manual',
    paymentGatewayName: 'Manual',
    paymentGatewayLabel: 'Manual / Admin',
    status: 'payment_confirmed',
    paymentReference: `MANUAL-ALL-${Date.now()}`,
    paidAt: Timestamp.fromDate(CONFIG.issueDate),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  const orderId = orderRef.id;
  console.log(`✓ Order created: ${orderId} ($${total.toFixed(2)})`);

  for (const item of cartItems) {
    await db.collection('orderItems').add({
      orderId,
      userId: uid,
      ...item,
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  const paymentRef = `MANUAL-ALL-${Date.now()}`;
  await db.collection('payments').add({
    userId: uid,
    orderId,
    gateway: 'manual',
    gatewayName: 'Manual',
    amount: total,
    currency: 'USD',
    status: 'completed',
    reference: paymentRef,
    countryCode: 'LK',
    country: 'Sri Lanka',
    testMode: false,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const invoiceNumber = generateInvoiceNumber();
  const invoiceRef = await db.collection('invoices').add({
    invoiceNumber,
    userId: uid,
    orderId,
    serviceId: null,
    invoiceType: 'order',
    lineItems: toProvision.map((d) => ({
      name: `${d.name} — ${d.billingCycle}`,
      amount: d.price,
    })),
    subtotal,
    tax,
    discount: 0,
    total,
    currency: 'USD',
    status: 'paid',
    issueDate: Timestamp.fromDate(CONFIG.issueDate),
    dueDate: Timestamp.fromDate(CONFIG.issueDate),
    paidDate: Timestamp.fromDate(CONFIG.issueDate),
    billingPeriodStart: Timestamp.fromDate(CONFIG.issueDate),
    billingPeriodEnd: Timestamp.fromDate(renewalDate),
    paymentReference: paymentRef,
    notes: 'All platform services — provisioned via admin script',
    createdAt: FieldValue.serverTimestamp(),
  });
  console.log(`✓ Invoice created: ${invoiceNumber}`);

  const serviceIds = [];
  for (const def of toProvision) {
    const serviceRef = await db.collection('services').add({
      userId: uid,
      orderId,
      name: def.name,
      type: def.type,
      packageId: def.packageId,
      status: 'active',
      billingStatus: 'active',
      billingCycle: def.billingCycle,
      config: def.config,
      credentials: def.credentials,
      onDemandUsage: def.onDemandUsage || defaultOnDemandUsage(),
      nextRenewalDate: Timestamp.fromDate(def.renewalDate),
      activatedAt: Timestamp.fromDate(CONFIG.issueDate),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    const serviceId = serviceRef.id;
    serviceIds.push({ name: def.name, id: serviceId, type: def.type });

    if (def.cdnPlan) {
      const subId = await createCdnSubscription(db, uid, serviceId, orderId, def.cdnPlan);
      await serviceRef.update({
        cdnSubscriptionId: subId,
        updatedAt: FieldValue.serverTimestamp(),
      });
      console.log(`✓ ${def.name} → ${serviceId} (+ CDN sub ${subId})`);
    } else {
      console.log(`✓ ${def.name} → ${serviceId}`);
    }
  }

  await invoiceRef.update({ serviceId: serviceIds[0]?.id || null });

  await db.collection('adminLogs').add({
    adminId: 'script:provision-all-services',
    action: 'provision_all_services',
    details: {
      uid,
      email: CONFIG.email,
      orderId,
      serviceIds,
      invoiceNumber,
    },
    createdAt: FieldValue.serverTimestamp(),
  });

  console.log('\n====================================');
  console.log('DONE — Customer can log in at:');
  console.log('  https://feedforge.cloud/login');
  console.log(`  Email:    ${CONFIG.email}`);
  console.log(`  Password: (as provided)`);
  console.log('\nServices provisioned:');
  for (const s of serviceIds) {
    console.log(`  • ${s.name}: https://feedforge.cloud/dashboard/services/${s.id}`);
  }
  console.log('====================================\n');
}

main().catch((err) => {
  console.error('\nProvisioning failed:', err.message || err);
  process.exit(1);
});
