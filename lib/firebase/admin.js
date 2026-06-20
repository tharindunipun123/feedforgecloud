import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

let adminDb = null;
let adminStorage = null;

function loadServiceAccount() {
  const accountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (accountPath) {
    const resolved = path.resolve(process.cwd(), accountPath);
    if (fs.existsSync(resolved)) {
      return JSON.parse(fs.readFileSync(resolved, 'utf8'));
    }
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountJson) {
    return JSON.parse(serviceAccountJson);
  }

  return null;
}

export function initAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const serviceAccount = loadServiceAccount();
  if (serviceAccount) {
    return initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return initializeApp({
      credential: applicationDefault(),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }

  return null;
}

export function getAdminDb() {
  if (!adminDb) {
    const app = initAdminApp();
    if (!app) return null;
    adminDb = getFirestore(app);
  }
  return adminDb;
}

export function getAdminStorage() {
  if (!adminStorage) {
    const app = initAdminApp();
    if (!app) return null;
    adminStorage = getStorage(app);
  }
  return adminStorage;
}

export function hashApiKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

export async function validateApiKeyRequest(apiKey, requiredPermission) {
  const db = getAdminDb();
  if (!db) throw new Error('Server Firebase Admin is not configured.');

  const keyHash = hashApiKey(apiKey);
  const snap = await db.collection('apiKeys').where('keyHash', '==', keyHash).limit(1).get();

  if (snap.empty) return { valid: false, error: 'Invalid API key.', status: 401 };

  const keyDoc = snap.docs[0];
  const keyData = keyDoc.data();

  if (keyData.status !== 'active') return { valid: false, error: 'API key is revoked.', status: 401 };
  if (requiredPermission && !keyData.permissions?.[requiredPermission]) {
    return { valid: false, error: `Missing ${requiredPermission} permission.`, status: 403 };
  }

  const subSnap = await db
    .collection('cdnSubscriptions')
    .where('userId', '==', keyData.userId)
    .where('status', '==', 'active')
    .limit(1)
    .get();

  if (subSnap.empty) {
    return { valid: false, error: 'No active CDN subscription.', status: 403 };
  }

  await keyDoc.ref.update({ lastUsedAt: new Date() });

  await db.collection('apiRequests').add({
    userId: keyData.userId,
    apiKeyId: keyDoc.id,
    permission: requiredPermission,
    createdAt: new Date(),
  });

  return {
    valid: true,
    userId: keyData.userId,
    keyId: keyDoc.id,
    subscription: { id: subSnap.docs[0].id, ...subSnap.docs[0].data() },
  };
}
