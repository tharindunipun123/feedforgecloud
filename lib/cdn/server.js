import { getAdminDb, getAdminStorage, validateApiKeyRequest } from '@/lib/firebase/admin';
import { generateCdnUrl } from '@/data/cdn';

export async function processApiUpload(userId, subscription, fileBuffer, fileName, mimeType) {
  const db = getAdminDb();
  const storage = getAdminStorage();
  if (!db || !storage) throw new Error('Server Firebase Admin is not configured.');

  const creditsNeeded = Math.ceil(fileBuffer.length / (1024 * 1024));
  const remaining = subscription.remainingCredits ?? 0;

  if (creditsNeeded > remaining) {
    throw new Error('Insufficient CDN credits. Please upgrade your plan or free storage.');
  }

  const allowed = subscription.allowedFileTypes || ['*'];
  if (allowed[0] !== '*' && !allowed.includes(mimeType)) {
    throw new Error(`File type ${mimeType} is not allowed on your plan.`);
  }

  const sizeMB = fileBuffer.length / (1024 * 1024);
  const category = mimeType.startsWith('image/') ? 'image' : mimeType.startsWith('video/') ? 'video' : 'file';

  if (category === 'image' && sizeMB > (subscription.maxImageSizeMB || 10)) {
    throw new Error(`Image exceeds max size of ${subscription.maxImageSizeMB} MB.`);
  }
  if (category === 'video' && sizeMB > (subscription.maxVideoSizeMB || 100)) {
    throw new Error(`Video exceeds max size of ${subscription.maxVideoSizeMB} MB.`);
  }

  const assetRef = db.collection('cdnAssets').doc();
  const storagePath = `cdn/${userId}/${assetRef.id}/${fileName}`;
  const bucket = storage.bucket();
  const file = bucket.file(storagePath);

  await file.save(fileBuffer, { contentType: mimeType, metadata: { cacheControl: 'public, max-age=31536000' } });
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

  const cdnUrl = generateCdnUrl(assetRef.id, fileName);
  const now = new Date();

  const assetData = {
    userId,
    subscriptionId: subscription.id,
    fileName,
    fileSizeBytes: fileBuffer.length,
    fileSizeMB: creditsNeeded,
    mimeType,
    fileType: category,
    storagePath,
    publicUrl: publicUrl,
    cdnUrl,
    folder: '/',
    tags: [],
    altText: '',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };

  await assetRef.set(assetData);

  await db.collection('cdnSubscriptions').doc(subscription.id).update({
    usedCredits: (subscription.usedCredits || 0) + creditsNeeded,
    remainingCredits: remaining - creditsNeeded,
    storageUsedMB: (subscription.storageUsedMB || 0) + creditsNeeded,
    updatedAt: now,
  });

  await db.collection('cdnUsageLogs').add({
    userId,
    subscriptionId: subscription.id,
    action: 'upload',
    assetId: assetRef.id,
    creditsUsed: creditsNeeded,
    fileName,
    fileSizeBytes: fileBuffer.length,
    source: 'api',
    createdAt: now,
  });

  return { id: assetRef.id, ...assetData };
}

export async function authenticateCdnApi(request, permission) {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');
  if (!apiKey) return { error: 'Missing API key.', status: 401 };
  return validateApiKeyRequest(apiKey, permission);
}

export { validateApiKeyRequest };
