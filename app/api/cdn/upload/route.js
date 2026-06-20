import { NextResponse } from 'next/server';
import { authenticateCdnApi, processApiUpload } from '@/lib/cdn/server';

export async function POST(request) {
  try {
    const auth = await authenticateCdnApi(request, 'upload');
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'File is required.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const asset = await processApiUpload(
      auth.userId,
      { id: auth.subscription.id, ...auth.subscription },
      buffer,
      file.name,
      file.type || 'application/octet-stream'
    );

    return NextResponse.json({
      success: true,
      asset: {
        id: asset.id,
        fileName: asset.fileName,
        fileSizeBytes: asset.fileSizeBytes,
        fileType: asset.fileType,
        publicUrl: asset.publicUrl,
        cdnUrl: asset.cdnUrl,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Upload failed.' }, { status: 400 });
  }
}
