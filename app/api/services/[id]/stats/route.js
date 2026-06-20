import { NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/firebase/auth-server';
import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { fetchServerStats } from '@/lib/monitoring/server-stats';
import { hasServerAccess, isMonitorableService } from '@/lib/monitoring/helpers';

export async function GET(request, { params }) {
  try {
    const decoded = await verifyAuthToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

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
        message: 'Server stats will be available once your instance is provisioned with credentials.',
      });
    }

    const metricsRef = db.collection('serviceMetrics').doc(serviceId);
    const cachedSnap = await metricsRef.get();
    const cached = cachedSnap.exists ? cachedSnap.data() : null;
    const cacheAge = cached?.fetchedAt ? Date.now() - new Date(cached.fetchedAt).getTime() : Infinity;

    if (cached && cacheAge < 60000) {
      return NextResponse.json({ available: true, stats: cached, cached: true });
    }

    try {
      const stats = await fetchServerStats(service.credentials);
      const history = cached?.history || [];
      history.push({ ...stats, timestamp: stats.fetchedAt });
      const trimmedHistory = history.slice(-30);

      const metricsData = {
        ...stats,
        history: trimmedHistory,
        serviceId,
        updatedAt: FieldValue.serverTimestamp(),
      };

      await metricsRef.set(metricsData, { merge: true });

      return NextResponse.json({ available: true, stats: { ...stats, history: trimmedHistory }, cached: false });
    } catch (sshErr) {
      if (cached) {
        return NextResponse.json({
          available: true,
          stats: cached,
          cached: true,
          warning: 'Could not reach server. Showing last known stats.',
        });
      }
      return NextResponse.json({
        available: false,
        reason: 'connection_failed',
        message: 'Unable to connect to server. Please verify credentials or try again later.',
      });
    }
  } catch (err) {
    console.error('Stats API error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch stats.' }, { status: 500 });
  }
}
