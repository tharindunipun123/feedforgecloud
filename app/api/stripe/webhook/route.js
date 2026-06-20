import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/config';
import { handleStripeCheckoutComplete, updatePaymentRecord } from '@/lib/stripe/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

export async function POST(request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  let event;
  try {
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      event = JSON.parse(body);
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.payment_status === 'paid' || session.status === 'complete') {
          await handleStripeCheckoutComplete(session);
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        if (subscriptionId) {
          const db = getAdminDb();
          if (db) {
            const servicesSnap = await db
              .collection('services')
              .where('stripeSubscriptionId', '==', subscriptionId)
              .get();

            const renewalDate = new Date();
            renewalDate.setMonth(renewalDate.getMonth() + 1);

            for (const doc of servicesSnap.docs) {
              await doc.ref.update({
                billingStatus: 'active',
                nextRenewalDate: renewalDate,
                updatedAt: FieldValue.serverTimestamp(),
              });
            }
          }
        }
        break;
      }

      case 'customer.subscription.deleted':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const db = getAdminDb();
        if (db) {
          const servicesSnap = await db
            .collection('services')
            .where('stripeSubscriptionId', '==', subscription.id)
            .get();

          const billingStatus = subscription.status === 'active' ? 'active' : 'cancelled';
          const serviceStatus = subscription.status === 'active' ? 'active' : 'suspended';

          for (const doc of servicesSnap.docs) {
            await doc.ref.update({
              billingStatus,
              status: serviceStatus,
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
        }
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object;
        const orderId = session.metadata?.orderId;
        if (orderId) {
          await updatePaymentRecord(orderId, { status: 'expired' });
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
