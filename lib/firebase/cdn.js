import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/config';
import { sortByCreatedAt } from '@/lib/firebase/query-helpers';
import { getCdnPlanById } from '@/data/cdn';
import {
  computeNextResetDate,
  creditsFromBytes,
  generateApiKey,
  hashApiKey,
  getApiKeyPrefix,
} from '@/lib/cdn/helpers';
import { generateCdnUrl } from '@/data/cdn';

function getDb() {
  if (!db) throw new Error('Firebase is not configured.');
  return db;
}

function getStorage() {
  if (!storage) throw new Error('Firebase Storage is not configured.');
  return storage;
}

export async function createCdnSubscription(userId, serviceId, orderId, planId, planData = null) {
  const plan = planData || getCdnPlanById(planId);
  if (!plan) throw new Error('CDN plan not found');

  const totalCredits = plan.storageCredits;
  const resetDate = computeNextResetDate();

  const subRef = await addDoc(collection(getDb(), 'cdnSubscriptions'), {
    userId,
    serviceId,
    orderId,
    planId: plan.id,
    planName: plan.name,
    status: 'active',
    totalCredits,
    usedCredits: 0,
    remainingCredits: totalCredits,
    storageUsedMB: 0,
    bandwidthUsedMB: 0,
    bandwidthCredits: plan.bandwidthCredits,
    maxImageSizeMB: plan.maxImageSizeMB,
    maxVideoSizeMB: plan.maxVideoSizeMB,
    allowedFileTypes: plan.allowedFileTypes,
    monthlyResetDate: resetDate,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await updateDoc(doc(getDb(), 'services', serviceId), {
    status: 'active',
    cdnSubscriptionId: subRef.id,
    activatedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return subRef.id;
}

export async function getUserCdnSubscription(userId) {
  const q = query(
    collection(getDb(), 'cdnSubscriptions'),
    where('userId', '==', userId),
    where('status', '==', 'active')
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const subs = sortByCreatedAt(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  return subs[0];
}

export async function getCdnSubscription(subId) {
  const snap = await getDoc(doc(getDb(), 'cdnSubscriptions', subId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getAllCdnSubscriptions() {
  const snap = await getDocs(collection(getDb(), 'cdnSubscriptions'));
  return sortByCreatedAt(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
}

export async function updateCdnSubscription(subId, data) {
  await updateDoc(doc(getDb(), 'cdnSubscriptions', subId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function getUserCdnAssets(userId, includeDeleted = false) {
  const q = query(collection(getDb(), 'cdnAssets'), where('userId', '==', userId));
  const snap = await getDocs(q);
  let assets = sortByCreatedAt(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  if (!includeDeleted) assets = assets.filter((a) => a.status !== 'deleted');
  return assets;
}

export async function getCdnAsset(assetId) {
  const snap = await getDoc(doc(getDb(), 'cdnAssets', assetId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getAllCdnAssets() {
  const snap = await getDocs(collection(getDb(), 'cdnAssets'));
  return sortByCreatedAt(snap.docs.map((d) => ({ id: d.id, ...d.data() }))).filter(
    (a) => a.status !== 'deleted'
  );
}

export async function logCdnUsage(userId, subscriptionId, data) {
  await addDoc(collection(getDb(), 'cdnUsageLogs'), {
    userId,
    subscriptionId,
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function getUserCdnUsageLogs(userId) {
  const q = query(collection(getDb(), 'cdnUsageLogs'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return sortByCreatedAt(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
}

export async function getAllCdnUsageLogs() {
  const snap = await getDocs(collection(getDb(), 'cdnUsageLogs'));
  return sortByCreatedAt(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
}

export async function uploadCdnAsset(userId, subscription, file, metadata = {}, onProgress) {
  const creditsNeeded = creditsFromBytes(file.size);
  const remaining = subscription.remainingCredits ?? 0;

  if (creditsNeeded > remaining) {
    throw new Error('Insufficient CDN credits. Please upgrade your plan or free storage.');
  }

  const plan = {
    allowedFileTypes: subscription.allowedFileTypes || ['*'],
    maxImageSizeMB: subscription.maxImageSizeMB || 10,
    maxVideoSizeMB: subscription.maxVideoSizeMB || 100,
  };

  const mimeType = file.type || 'application/octet-stream';
  if (plan.allowedFileTypes[0] !== '*' && !plan.allowedFileTypes.includes(mimeType)) {
    throw new Error(`File type ${mimeType} is not allowed on your plan.`);
  }

  const sizeMB = file.size / (1024 * 1024);
  const category = mimeType.startsWith('image/') ? 'image' : mimeType.startsWith('video/') ? 'video' : 'file';

  if (category === 'image' && sizeMB > plan.maxImageSizeMB) {
    throw new Error(`Image exceeds max size of ${plan.maxImageSizeMB} MB.`);
  }
  if (category === 'video' && sizeMB > plan.maxVideoSizeMB) {
    throw new Error(`Video exceeds max size of ${plan.maxVideoSizeMB} MB.`);
  }

  const assetRef = doc(collection(getDb(), 'cdnAssets'));
  const storagePath = `cdn/${userId}/${assetRef.id}/${file.name}`;
  const storageRef = ref(getStorage(), storagePath);

  await new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file, { contentType: mimeType });
    task.on(
      'state_changed',
      (snap) => {
        if (onProgress) onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
      },
      reject,
      resolve
    );
  });

  const downloadUrl = await getDownloadURL(storageRef);
  const cdnUrl = generateCdnUrl(assetRef.id, file.name);

  const assetData = {
    userId,
    subscriptionId: subscription.id,
    fileName: file.name,
    fileSizeBytes: file.size,
    fileSizeMB: creditsNeeded,
    mimeType,
    fileType: category,
    storagePath,
    publicUrl: downloadUrl,
    cdnUrl,
    folder: metadata.folder || '/',
    tags: metadata.tags || [],
    altText: metadata.altText || '',
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(assetRef, assetData);

  await updateDoc(doc(getDb(), 'cdnSubscriptions', subscription.id), {
    usedCredits: increment(creditsNeeded),
    remainingCredits: increment(-creditsNeeded),
    storageUsedMB: increment(creditsNeeded),
    updatedAt: serverTimestamp(),
  });

  await logCdnUsage(userId, subscription.id, {
    action: 'upload',
    assetId: assetRef.id,
    creditsUsed: creditsNeeded,
    fileName: file.name,
    fileSizeBytes: file.size,
  });

  return { id: assetRef.id, ...assetData, publicUrl: downloadUrl, cdnUrl };
}

export async function deleteCdnAsset(userId, assetId, removeFromStorage = true) {
  const asset = await getCdnAsset(assetId);
  if (!asset || asset.userId !== userId) throw new Error('Asset not found');
  if (asset.status === 'deleted') return;

  if (removeFromStorage && asset.storagePath) {
    try {
      await deleteObject(ref(getStorage(), asset.storagePath));
    } catch {
      // Storage file may already be removed
    }
  }

  await updateDoc(doc(getDb(), 'cdnAssets', assetId), {
    status: 'deleted',
    deletedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  if (asset.subscriptionId) {
    const credits = asset.fileSizeMB || creditsFromBytes(asset.fileSizeBytes || 0);
    await updateDoc(doc(getDb(), 'cdnSubscriptions', asset.subscriptionId), {
      usedCredits: increment(-credits),
      remainingCredits: increment(credits),
      storageUsedMB: increment(-credits),
      updatedAt: serverTimestamp(),
    });

    await logCdnUsage(userId, asset.subscriptionId, {
      action: 'delete',
      assetId,
      creditsUsed: -credits,
      fileName: asset.fileName,
    });
  }
}

export async function createApiKey(userId, name, permissions = { upload: true, read: true, delete: false }) {
  const fullKey = generateApiKey();
  const keyHash = await hashApiKey(fullKey);
  const keyPrefix = getApiKeyPrefix(fullKey);

  const refDoc = await addDoc(collection(getDb(), 'apiKeys'), {
    userId,
    name,
    keyHash,
    keyPrefix,
    permissions,
    status: 'active',
    lastUsedAt: null,
    createdAt: serverTimestamp(),
  });

  return { id: refDoc.id, fullKey, keyPrefix };
}

export async function getUserApiKeys(userId) {
  const q = query(collection(getDb(), 'apiKeys'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return sortByCreatedAt(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
}

export async function getAllApiKeys() {
  const snap = await getDocs(collection(getDb(), 'apiKeys'));
  return sortByCreatedAt(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
}

export async function revokeApiKey(userId, keyId) {
  const snap = await getDoc(doc(getDb(), 'apiKeys', keyId));
  if (!snap.exists() || snap.data().userId !== userId) throw new Error('API key not found');
  await updateDoc(doc(getDb(), 'apiKeys', keyId), {
    status: 'revoked',
    revokedAt: serverTimestamp(),
  });
}

export async function adminRevokeApiKey(keyId) {
  await updateDoc(doc(getDb(), 'apiKeys', keyId), {
    status: 'revoked',
    revokedAt: serverTimestamp(),
  });
}

export async function getCdnPlansFromFirestore() {
  const snap = await getDocs(collection(getDb(), 'cdnPlans'));
  if (snap.empty) return null;
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function saveCdnPlan(planId, data, adminId) {
  await updateDoc(doc(getDb(), 'cdnPlans', planId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function seedCdnPlansIfEmpty(adminId) {
  const existing = await getDocs(collection(getDb(), 'cdnPlans'));
  if (!existing.empty) return;
  const { CDN_PLANS } = await import('@/data/cdn');
  for (const plan of CDN_PLANS) {
    await addDoc(collection(getDb(), 'cdnPlans'), { ...plan, active: true, createdAt: serverTimestamp() });
  }
}

export { generateCdnUrl, creditsFromBytes };
