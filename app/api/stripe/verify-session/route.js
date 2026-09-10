import { NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/firebase/auth-server';
import { getStripe } from '@/lib/stripe/config';
import { handleStripeCheckoutComplete } from '@/lib/stripe/server';
import { getAdminDb } from '@/lib/firebase/admin';

export async function POST(request) {
  try {
    const { sessionId, orderId, invoiceId } = await request.json();
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required.' }, { status: 400 });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const isRenewal = session.metadata?.type === 'renewal';

    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const authResult = await verifyAuthToken(request);
      if (authResult.ok && session.metadata?.userId && session.metadata.userId !== authResult.decoded.uid) {
        return NextResponse.json({ error: 'Session does not belong to this user.' }, { status: 403 });
      }
    }

    const db = getAdminDb();

    if (isRenewal) {
      const resolvedInvoiceId = invoiceId || session.metadata?.invoiceId || session.client_reference_id;
      if (!resolvedInvoiceId) {
        return NextResponse.json({ error: 'Could not resolve invoice from Stripe session.' }, { status: 400 });
      }

      if (session.metadata?.invoiceId && session.metadata.invoiceId !== resolvedInvoiceId) {
        return NextResponse.json({ error: 'Invoice ID does not match Stripe session.' }, { status: 400 });
      }

      if (db) {
        const invoiceSnap = await db.collection('invoices').doc(resolvedInvoiceId).get();
        if (invoiceSnap.exists && invoiceSnap.data().status === 'paid') {
          return NextResponse.json({
            confirmed: true,
            invoiceId: resolvedInvoiceId,
            alreadyConfirmed: true,
            renewed: true,
            serviceId: invoiceSnap.data().serviceId || null,
          });
        }
      }

      if (session.payment_status === 'paid' || session.status === 'complete') {
        const result = await handleStripeCheckoutComplete(session);
        return NextResponse.json({ confirmed: true, renewed: true, invoiceId: resolvedInvoiceId, ...result });
      }

      return NextResponse.json({ confirmed: false, status: session.payment_status });
    }

    const resolvedOrderId = orderId || session.metadata?.orderId || session.client_reference_id;

    if (!resolvedOrderId) {
      return NextResponse.json({ error: 'Could not resolve order from Stripe session.' }, { status: 400 });
    }

    if (session.metadata?.orderId && session.metadata.orderId !== resolvedOrderId) {
      return NextResponse.json({ error: 'Order ID does not match Stripe session.' }, { status: 400 });
    }

    if (db) {
      const orderSnap = await db.collection('orders').doc(resolvedOrderId).get();
      if (orderSnap.exists && orderSnap.data().status === 'payment_confirmed') {
        const servicesSnap = await db.collection('services').where('orderId', '==', resolvedOrderId).get();
        if (!servicesSnap.empty) {
          return NextResponse.json({
            confirmed: true,
            orderId: resolvedOrderId,
            alreadyConfirmed: true,
            serviceIds: servicesSnap.docs.map((d) => d.id),
          });
        }
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
