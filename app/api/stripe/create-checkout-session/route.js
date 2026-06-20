import { NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/firebase/auth-server';
import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { createStripeCheckoutSession } from '@/lib/stripe/server';

export async function POST(request) {
  try {
    const decoded = await verifyAuthToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    const { orderPayload, gatewayId } = body;

    if (!orderPayload?.items?.length) {
      return NextResponse.json({ error: 'Cart is empty.' }, { status: 400 });
    }

    if (gatewayId !== 'stripe') {
      return NextResponse.json({ error: 'Only Stripe checkout is supported via this endpoint.' }, { status: 400 });
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    const orderData = {
      ...orderPayload,
      userId: decoded.uid,
      countryCode: orderPayload.customer?.countryCode,
      country: orderPayload.customer?.country,
      paymentGateway: 'stripe',
      paymentGatewayName: 'Stripe',
      paymentGatewayLabel: 'Stripe',
      status: 'pending_payment',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const orderRef = await db.collection('orders').add(orderData);
    const orderId = orderRef.id;

    for (const item of orderPayload.items) {
      await db.collection('orderItems').add({
        orderId,
        userId: decoded.uid,
        ...item,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    await db.collection('payments').add({
      userId: decoded.uid,
      orderId,
      gateway: 'stripe',
      gatewayName: 'Stripe',
      amount: orderPayload.total,
      currency: orderPayload.currency || 'USD',
      status: 'pending',
      reference: null,
      countryCode: orderPayload.customer?.countryCode,
      country: orderPayload.customer?.country,
      testMode: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const session = await createStripeCheckoutSession({
      orderId,
      order: { ...orderData, userId: decoded.uid },
      userEmail: orderPayload.customer?.email || decoded.email,
      successUrl: `${origin}/payment/success?orderId=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/payment/failed?orderId=${orderId}`,
    });

    await orderRef.update({
      stripeSessionId: session.id,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ orderId, sessionId: session.id, url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create checkout session.' }, { status: 500 });
  }
}
