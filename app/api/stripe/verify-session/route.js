import { NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/firebase/auth-server';
import { getStripe } from '@/lib/stripe/config';
import { handleStripeCheckoutComplete } from '@/lib/stripe/server';
import { getAdminDb } from '@/lib/firebase/admin';

export async function POST(request) {
  try {
    const decoded = await verifyAuthToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { sessionId, orderId } = await request.json();
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required.' }, { status: 400 });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.metadata?.userId !== decoded.uid) {
      return NextResponse.json({ error: 'Session does not belong to this user.' }, { status: 403 });
    }

    const resolvedOrderId = orderId || session.metadata?.orderId || session.client_reference_id;

    const db = getAdminDb();
    if (db && resolvedOrderId) {
      const orderSnap = await db.collection('orders').doc(resolvedOrderId).get();
      if (orderSnap.exists && orderSnap.data().status === 'payment_confirmed') {
        return NextResponse.json({ confirmed: true, orderId: resolvedOrderId, alreadyConfirmed: true });
      }
    }

    if (session.payment_status === 'paid' || session.status === 'complete') {
      const result = await handleStripeCheckoutComplete(session);
      return NextResponse.json({ confirmed: true, ...result });
    }

    return NextResponse.json({ confirmed: false, status: session.payment_status });
  } catch (err) {
    console.error('Verify session error:', err);
    return NextResponse.json({ error: err.message || 'Verification failed.' }, { status: 500 });
  }
}
