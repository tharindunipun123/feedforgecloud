import { NextResponse } from 'next/server';
import { authenticateCdnApi } from '@/lib/cdn/server';
import { getAdminDb } from '@/lib/firebase/admin';

export async function GET(request) {
  try {
    const auth = await authenticateCdnApi(request, 'read');
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
    }

    const db = getAdminDb();
    const snap = await db
      .collection('cdnAssets')
      .where('userId', '==', auth.userId)
      .where('status', '==', 'active')
      .get();

    const assets = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        fileName: data.fileName,
        fileSizeBytes: data.fileSizeBytes,
        fileType: data.fileType,
        mimeType: data.mimeType,
        publicUrl: data.publicUrl,
        cdnUrl: data.cdnUrl,
        createdAt: data.createdAt,
      };
    });

    return NextResponse.json({ assets });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Failed to list assets.' }, { status: 500 });
  }
}
