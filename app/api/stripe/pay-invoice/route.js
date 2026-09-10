import { NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/firebase/auth-server';
import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { createInvoiceCheckoutSession } from '@/lib/stripe/server';

export async function POST(request) {
  try {
    const authResult = await verifyAuthToken(request);
    if (!authResult.ok) {
      return NextResponse.json(
        { error: authResult.message, code: authResult.code },
        { status: authResult.code === 'admin_not_configured' ? 503 : 401 }
      );
    }
    const decoded = authResult.decoded;

    const { invoiceId } = await request.json();
    if (!invoiceId) {
      return NextResponse.json({ error: 'invoiceId is required.' }, { status: 400 });
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    const invoiceRef = db.collection('invoices').doc(invoiceId);
    const invoiceSnap = await invoiceRef.get();
    if (!invoiceSnap.exists) {
      return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
    }

    const invoice = invoiceSnap.data();
    if (invoice.userId !== decoded.uid) {
      return NextResponse.json({ error: 'You do not have access to this invoice.' }, { status: 403 });
    }
    if (invoice.status === 'paid') {
      return NextResponse.json({ error: 'This invoice is already paid.' }, { status: 400 });
    }

    await db.collection('payments').add({
      userId: decoded.uid,
      invoiceId,
      serviceId: invoice.serviceId || null,
      gateway: 'stripe',
      gatewayName: 'Stripe',
      amount: invoice.total || 0,
      currency: invoice.currency || 'USD',
      status: 'pending',
      reference: null,
      paymentType: 'renewal',
      testMode: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const session = await createInvoiceCheckoutSession({
      invoiceId,
      invoice: { ...invoice, userId: decoded.uid },
      userEmail: decoded.email,
      successUrl: `${origin}/payment/success?invoiceId=${invoiceId}&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/dashboard/invoices/${invoiceId}?cancelled=1`,
    });

    await invoiceRef.update({
      stripeSessionId: session.id,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ invoiceId, sessionId: session.id, url: session.url });
  } catch (err) {
    console.error('Pay invoice error:', err);
    return NextResponse.json({ error: err.message || 'Failed to start payment.' }, { status: 500 });
  }
}
