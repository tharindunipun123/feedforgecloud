import { NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/firebase/auth-server';
import { getAdminDb } from '@/lib/firebase/admin';
import { hasServerAccess, isMonitorableService } from '@/lib/monitoring/helpers';
import { generateSimulatedServerStats } from '@/lib/server/display';

export async function GET(request, { params }) {
  try {
    const authResult = await verifyAuthToken(request);
    if (!authResult.ok) {
      return NextResponse.json(
        { error: authResult.message, code: authResult.code },
        { status: authResult.code === 'admin_not_configured' ? 503 : 401 }
      );
    }
    const decoded = authResult.decoded;

    const { id: serviceId } = await params;
    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    const serviceSnap = await db.collection('services').doc(serviceId).get();
    if (!serviceSnap.exists) {
      return NextResponse.json({ error: 'Service not found.' }, { status: 404 });
    }

    const service = { id: serviceSnap.id, ...serviceSnap.data() };

    if (service.userId !== decoded.uid) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    if (!isMonitorableService(service)) {
      return NextResponse.json({ available: false, reason: 'not_monitorable' });
    }

    if (!hasServerAccess(service)) {
      return NextResponse.json({
        available: false,
        reason: 'awaiting_provisioning',
        message: 'Server stats will be available once your instance is activated.',
      });
    }

    const stats = generateSimulatedServerStats(serviceId);
    return NextResponse.json({ available: true, stats, simulated: true });
  } catch (err) {
    console.error('Stats API error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch stats.' }, { status: 500 });
  }
}
