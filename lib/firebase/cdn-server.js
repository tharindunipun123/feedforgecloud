import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import { getCdnPlanById } from '@/data/cdn';
import { computeNextResetDate } from '@/lib/cdn/helpers';

export async function createCdnSubscriptionServer(userId, serviceId, orderId, planId) {
  const db = getAdminDb();
  if (!db) throw new Error('Firebase Admin is not configured.');

  const plan = getCdnPlanById(planId);
  if (!plan) throw new Error('CDN plan not found');

  const totalCredits = plan.storageCredits;
  const resetDate = computeNextResetDate();

  const subRef = await db.collection('cdnSubscriptions').add({
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
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await db.collection('services').doc(serviceId).update({
    status: 'active',
    cdnSubscriptionId: subRef.id,
    activatedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return subRef.id;
}
