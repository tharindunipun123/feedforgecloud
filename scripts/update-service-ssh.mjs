/**
 * Update SSH credentials on an existing service (Firestore).
 *
 * Usage:
 *   node --env-file=.env.local scripts/update-service-ssh.mjs
 *   node --env-file=.env.local scripts/update-service-ssh.mjs --service-id=abc123
 *   node --env-file=.env.local scripts/update-service-ssh.mjs --email=user@example.com --ip=1.2.3.4
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

function getArg(name, fallback = '') {
  const prefix = `--${name}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

const CONFIG = {
  serviceId: getArg('service-id'),
  email: getArg('email', 'gayathricctv@gmail.com'),
  ip: getArg('ip', '67.217.62.194'),
  username: getArg('username', 'root'),
  password: getArg('password', 'novascript2025V#'),
  sshPort: getArg('ssh-port', '22'),
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
  throw new Error('Firebase service account not found.');
}

function initFirebase() {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({ credential: cert(loadServiceAccount()) });
}

async function main() {
  initFirebase();
  const db = getFirestore();
  const auth = getAuth();

  const credentials = {
    ip: CONFIG.ip,
    username: CONFIG.username,
    password: CONFIG.password,
    sshPort: CONFIG.sshPort,
  };

  if (CONFIG.serviceId) {
    const ref = db.collection('services').doc(CONFIG.serviceId);
    const snap = await ref.get();
    if (!snap.exists) throw new Error(`Service not found: ${CONFIG.serviceId}`);
    await ref.update({
      credentials: { ...(snap.data().credentials || {}), ...credentials },
      status: 'active',
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log(`✓ Updated service ${CONFIG.serviceId}`);
    console.log(`  IP: ${CONFIG.ip}`);
    console.log(`  Password set to: ${CONFIG.password}`);
    return;
  }

  const user = await auth.getUserByEmail(CONFIG.email);
  const servicesSnap = await db.collection('services').where('userId', '==', user.uid).get();

  if (servicesSnap.empty) {
    throw new Error(`No services found for ${CONFIG.email}`);
  }

  let updated = 0;
  for (const doc of servicesSnap.docs) {
    const data = doc.data();
    const isEc2 = data.type === 'ec2' || data.type === 'vps';
    if (!isEc2) continue;
    if (CONFIG.ip && data.credentials?.ip && data.credentials.ip !== CONFIG.ip) continue;

    await doc.ref.update({
      credentials: { ...(data.credentials || {}), ...credentials },
      status: data.status === 'provisioning' ? 'active' : data.status,
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log(`✓ Updated service ${doc.id} (${data.name})`);
    updated += 1;
  }

  if (updated === 0) {
    throw new Error(`No matching EC2/VPS services updated for ${CONFIG.email}`);
  }

  console.log(`\nDone — ${updated} service(s) now use SSH password: ${CONFIG.password}`);
}

main().catch((err) => {
  console.error('Update failed:', err.message || err);
  process.exit(1);
});
