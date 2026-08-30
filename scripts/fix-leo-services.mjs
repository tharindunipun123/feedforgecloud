/**
 * Align leohousetechnology@gmail.com services with their checkout items only.
 * Keeps: Pro EC2, Starter Broadcast, CDN Pro, Premium SSL (Annual)
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const EMAIL = 'leohousetechnology@gmail.com';
const BULK_ORDER_ID = 'zyplXvPwk0CMCnCr4dVD';
const IP = '67.217.62.194';
const SSH_PASSWORD = 'novascript2025V#';

const ALLOWED = [
  { type: 'live_streaming', packageId: 'stream-starter' },
  { type: 'ec2', packageId: 'pro-ec2' },
  { type: 'cdn_hosting', packageId: 'cdn-pro' },
  { type: 'ssl_certificate', packageId: 'ssl-premium' },
];

function loadServiceAccount() {
  const accountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 'firebase-service-account.json';
  return JSON.parse(fs.readFileSync(path.resolve(ROOT, accountPath), 'utf8'));
}

function initFirebase() {
  if (getApps().length > 0) return;
  initializeApp({ credential: cert(loadServiceAccount()) });
}

const sshCreds = {
  ip: IP,
  username: 'root',
  password: SSH_PASSWORD,
  sshPort: '22',
  os: 'Ubuntu 22.04 LTS',
  location: 'us-east',
  notes: 'Demo credentials',
};

async function main() {
  initFirebase();
  const auth = getAuth();
  const db = getFirestore();
  const user = await auth.getUserByEmail(EMAIL);
  const uid = user.uid;

  const snap = await db.collection('services').where('userId', '==', uid).where('orderId', '==', BULK_ORDER_ID).get();
  const services = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  console.log(`Found ${services.length} bulk-provisioned services for ${EMAIL}\n`);

  const keepIds = new Set();
  const updates = [];

  const streaming = services.find((s) => s.type === 'live_streaming');
  if (streaming) {
    keepIds.add(streaming.id);
    updates.push({
      id: streaming.id,
      patch: {
        name: 'Starter Broadcast',
        type: 'live_streaming',
        packageId: 'stream-starter',
        status: 'active',
        billingStatus: 'active',
        credentials: {
          streamUrl: 'https://feedforge.cloud/live',
          mountPoint: '/live',
          sourcePassword: 'stream_source_demo_2025',
          adminUrl: 'https://feedforge.cloud:8443/admin',
          adminPassword: 'stream_admin_demo_2025',
          serverIp: IP,
          region: 'us-east',
        },
      },
    });
  }

  const ec2 = services.find((s) => s.type === 'ec2');
  if (ec2) {
    keepIds.add(ec2.id);
    updates.push({
      id: ec2.id,
      patch: {
        name: 'Pro EC2',
        type: 'ec2',
        packageId: 'pro-ec2',
        status: 'active',
        billingStatus: 'active',
        config: {
          os: 'Ubuntu 22.04 LTS',
          location: 'us-east',
          vcpu: 4,
          ram: '8 GB',
          storage: '160 GB NVMe',
          bandwidth: '8 TB',
        },
        credentials: sshCreds,
      },
    });
  }

  const cdn = services.find((s) => s.type === 'cdn_hosting');
  if (cdn) {
    keepIds.add(cdn.id);
    updates.push({
      id: cdn.id,
      patch: {
        name: 'CDN Pro',
        type: 'cdn_hosting',
        packageId: 'cdn-pro',
        status: 'active',
        billingStatus: 'active',
        config: { planId: 'cdn-pro', storageCredits: 51200, bandwidthCredits: 153600 },
        credentials: {
          apiEndpoint: 'https://feedforge.cloud/api/cdn',
          apiKey: 'qscdn_demo_key_feedforge_2025',
          notes: 'CDN Pro plan',
        },
      },
      cdnPlanId: 'cdn-pro',
    });
  }

  const ssl = services.find((s) => s.type === 'ssl_certificate');
  if (ssl) {
    keepIds.add(ssl.id);
    updates.push({
      id: ssl.id,
      patch: {
        name: 'Premium SSL (Annual)',
        type: 'ssl_certificate',
        packageId: 'ssl-premium',
        status: 'active',
        billingStatus: 'active',
        billingCycle: 'annual',
        config: { domain: 'feedforge.cloud', validation: 'Organization Validation (OV)' },
        credentials: {
          domain: 'feedforge.cloud',
          certificateUrl: 'https://feedforge.cloud/ssl/premium-certificate.pem',
          privateKeyUrl: 'https://feedforge.cloud/ssl/premium-private.key',
          caBundleUrl: 'https://feedforge.cloud/ssl/premium-ca-bundle.pem',
          issuedAt: new Date().toISOString().slice(0, 10),
          expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
        },
      },
    });
  }

  for (const u of updates) {
    await db.collection('services').doc(u.id).update({
      ...u.patch,
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log(`✓ Updated: ${u.patch.name} (${u.id})`);

    if (u.cdnPlanId && cdn?.cdnSubscriptionId) {
      await db.collection('cdnSubscriptions').doc(cdn.cdnSubscriptionId).update({
        planId: 'cdn-pro',
        planName: 'CDN Pro',
        totalCredits: 51200,
        remainingCredits: 51200,
        bandwidthCredits: 153600,
        maxImageSizeMB: 50,
        maxVideoSizeMB: 2000,
        updatedAt: FieldValue.serverTimestamp(),
      });
      console.log(`  ↳ CDN subscription updated to CDN Pro`);
    }
  }

  for (const s of services) {
    if (keepIds.has(s.id)) continue;
    await db.collection('services').doc(s.id).update({
      status: 'cancelled',
      billingStatus: 'cancelled',
      cancelledAt: FieldValue.serverTimestamp(),
      cancelledBy: 'script:fix-leo-services',
      notes: 'Removed — not part of customer checkout items',
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log(`✗ Cancelled: ${s.name} (${s.type})`);
  }

  await db.collection('users').doc(uid).set(
    {
      aiWebsitePlan: 'ai-website-free',
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  console.log('\nDone. Active services for this customer:');
  console.log('  • Pro EC2');
  console.log('  • Starter Broadcast (Live Streaming)');
  console.log('  • CDN Pro');
  console.log('  • Premium SSL (Annual)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
