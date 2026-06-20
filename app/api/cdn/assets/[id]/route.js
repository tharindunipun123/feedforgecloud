import { NextResponse } from 'next/server';
import { authenticateCdnApi } from '@/lib/cdn/server';
import { getAdminDb, getAdminStorage } from '@/lib/firebase/admin';

export async function GET(request, { params }) {
  try {
    const auth = await authenticateCdnApi(request, 'read');
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
    }

    const { id } = await params;
    const db = getAdminDb();
    const doc = await db.collection('cdnAssets').doc(id).get();

    if (!doc.exists || doc.data().userId !== auth.userId || doc.data().status === 'deleted') {
      return NextResponse.json({ error: 'Asset not found.' }, { status: 404 });
    }

    const data = doc.data();
    return NextResponse.json({
      id: doc.id,
      fileName: data.fileName,
      fileSizeBytes: data.fileSizeBytes,
      fileType: data.fileType,
      mimeType: data.mimeType,
      publicUrl: data.publicUrl,
      cdnUrl: data.cdnUrl,
      folder: data.folder,
      tags: data.tags,
      altText: data.altText,
      createdAt: data.createdAt,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Failed to get asset.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await authenticateCdnApi(request, 'delete');
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
    }

    const { id } = await params;
    const db = getAdminDb();
    const storage = getAdminStorage();
    const docRef = db.collection('cdnAssets').doc(id);
    const doc = await docRef.get();

    if (!doc.exists || doc.data().userId !== auth.userId || doc.data().status === 'deleted') {
      return NextResponse.json({ error: 'Asset not found.' }, { status: 404 });
    }

    const data = doc.data();
    const credits = data.fileSizeMB || Math.ceil((data.fileSizeBytes || 0) / (1024 * 1024));

    if (data.storagePath && storage) {
      try {
        await storage.bucket().file(data.storagePath).delete();
      } catch {
        // ignore
      }
    }

    await docRef.update({ status: 'deleted', deletedAt: new Date(), updatedAt: new Date() });

    const subRef = db.collection('cdnSubscriptions').doc(data.subscriptionId);
    const sub = await subRef.get();
    if (sub.exists) {
      const subData = sub.data();
      await subRef.update({
        usedCredits: Math.max(0, (subData.usedCredits || 0) - credits),
        remainingCredits: (subData.remainingCredits || 0) + credits,
        storageUsedMB: Math.max(0, (subData.storageUsedMB || 0) - credits),
        updatedAt: new Date(),
      });
    }

    await db.collection('cdnUsageLogs').add({
      userId: auth.userId,
      subscriptionId: data.subscriptionId,
      action: 'delete',
      assetId: id,
      creditsUsed: -credits,
      fileName: data.fileName,
      source: 'api',
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Failed to delete asset.' }, { status: 500 });
  }
}
