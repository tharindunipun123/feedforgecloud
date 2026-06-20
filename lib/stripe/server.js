import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import { getDefaultServiceOnDemand } from '@/data/on-demand';
import { getStripe } from '@/lib/stripe/config';
import {
  generateInvoiceNumber,
  calculateDueDate,
  DEFAULT_PAYMENT_TERMS_DAYS,
} from '@/lib/billing/helpers';

function getDb() {
  const db = getAdminDb();
  if (!db) throw new Error('Firebase Admin is not configured.');
  return db;
}

export async function confirmPaymentServer(orderId, paymentReference, extra = {}) {
  const db = getDb();
  const orderRef = db.collection('orders').doc(orderId);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) throw new Error('Order not found');

  const order = orderSnap.data();
  if (order.status === 'payment_confirmed') {
    return { alreadyConfirmed: true, orderId };
  }

  await orderRef.update({
    status: 'payment_confirmed',
    paymentReference,
    paidAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    ...extra,
  });

  const invoiceId = await createInvoiceFromOrderServer(orderId, order, paymentReference);
  const serviceIds = await createServicesFromOrderServer(orderId, order, extra);

  return { invoiceId, serviceIds, orderId };
}

async function createInvoiceFromOrderServer(orderId, order, paymentReference) {
  const db = getDb();
  const invoiceNumber = generateInvoiceNumber();
  const issueDate = new Date();
  const dueDate = calculateDueDate(issueDate, DEFAULT_PAYMENT_TERMS_DAYS);

  const invoiceRef = await db.collection('invoices').add({
    invoiceNumber,
    userId: order.userId,
    orderId,
    serviceId: null,
    invoiceType: 'order',
    lineItems: order.items || [],
    subtotal: order.subtotal || 0,
    tax: order.tax || 0,
    discount: order.discount || 0,
    total: order.total || 0,
    currency: order.currency || 'USD',
    status: paymentReference ? 'paid' : 'unpaid',
    issueDate: FieldValue.serverTimestamp(),
    dueDate,
    paidDate: paymentReference ? FieldValue.serverTimestamp() : null,
    billingPeriodStart: FieldValue.serverTimestamp(),
    billingPeriodEnd: null,
    paymentReference,
    notes: '',
    createdAt: FieldValue.serverTimestamp(),
  });

  return invoiceRef.id;
}

async function createServicesFromOrderServer(orderId, order, extra = {}) {
  const db = getDb();
  const serviceIds = [];
  const items = order.items || [];
  const billingCycle = order.billingCycle || 'monthly';

  const renewalDate = new Date();
  if (billingCycle === 'annual') {
    renewalDate.setFullYear(renewalDate.getFullYear() + 1);
  } else {
    renewalDate.setMonth(renewalDate.getMonth() + 1);
  }

  for (const item of items) {
    const isCdn = item.type === 'cdn_hosting';
    const serviceRef = await db.collection('services').add({
      userId: order.userId,
      orderId,
      name: item.name,
      type: item.type,
      packageId: item.packageId,
      status: isCdn ? 'active' : 'provisioning',
      billingStatus: 'active',
      billingCycle: item.billingCycle || billingCycle,
      config: item.config || {},
      credentials: null,
      onDemandUsage: getDefaultServiceOnDemand(),
      nextRenewalDate: renewalDate,
      activatedAt: isCdn ? FieldValue.serverTimestamp() : null,
      stripeSubscriptionId: extra.stripeSubscriptionId || null,
      stripeCustomerId: extra.stripeCustomerId || null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    serviceIds.push(serviceRef.id);

    if (isCdn) {
      const { createCdnSubscriptionServer } = await import('@/lib/firebase/cdn-server');
      await createCdnSubscriptionServer(order.userId, serviceRef.id, orderId, item.packageId);
    }
  }

  if (extra.stripeCustomerId && order.userId) {
    await db.collection('users').doc(order.userId).set(
      { stripeCustomerId: extra.stripeCustomerId, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
  }

  return serviceIds;
}

export async function updatePaymentRecord(orderId, data) {
  const db = getDb();
  const snap = await db.collection('payments').where('orderId', '==', orderId).limit(1).get();
  if (snap.empty) return;
  await snap.docs[0].ref.update({ ...data, updatedAt: FieldValue.serverTimestamp() });
}

export function buildStripeLineItems(order) {
  const items = order.items || [];
  const billingCycle = order.billingCycle || 'monthly';
  const isSubscription = items.every((item) => item.type !== 'payg');
  const interval = billingCycle === 'annual' ? 'year' : 'month';

  const lineItems = items.map((item) => {
    let unitAmount = Math.round((item.price || 0) * 100);
    if (billingCycle === 'annual' && item.type !== 'payg') {
      unitAmount = Math.round(unitAmount * 10);
    }

    const lineItem = {
      price_data: {
        currency: (order.currency || 'USD').toLowerCase(),
        product_data: {
          name: item.name,
          metadata: {
            packageId: item.packageId || '',
            type: item.type || '',
          },
        },
        unit_amount: unitAmount,
      },
      quantity: item.quantity || 1,
    };

    if (isSubscription) {
      lineItem.price_data.recurring = { interval };
    }

    return lineItem;
  });

  if (order.tax > 0) {
    lineItems.push({
      price_data: {
        currency: (order.currency || 'USD').toLowerCase(),
        product_data: { name: 'Tax' },
        unit_amount: Math.round(order.tax * 100),
        ...(isSubscription ? { recurring: { interval } } : {}),
      },
      quantity: 1,
    });
  }

  if (order.discount > 0) {
    return { lineItems, discountAmount: Math.round(order.discount * 100), isSubscription };
  }

  return { lineItems, discountAmount: 0, isSubscription };
}

export async function createStripeCheckoutSession({ orderId, order, userEmail, successUrl, cancelUrl }) {
  const stripe = getStripe();
  const { lineItems, discountAmount, isSubscription } = buildStripeLineItems(order);

  const sessionParams = {
    mode: isSubscription ? 'subscription' : 'payment',
    line_items: lineItems,
    customer_email: userEmail,
    client_reference_id: orderId,
    metadata: {
      orderId,
      userId: order.userId,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
  };

  if (discountAmount > 0) {
    const coupon = await stripe.coupons.create({
      amount_off: discountAmount,
      currency: (order.currency || 'USD').toLowerCase(),
      duration: 'once',
      name: 'Order discount',
    });
    sessionParams.discounts = [{ coupon: coupon.id }];
  }

  if (isSubscription) {
    sessionParams.subscription_data = {
      metadata: { orderId, userId: order.userId },
    };
  } else {
    sessionParams.payment_intent_data = {
      metadata: { orderId, userId: order.userId },
    };
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  return session;
}

export async function handleStripeCheckoutComplete(session) {
  const orderId = session.metadata?.orderId || session.client_reference_id;
  if (!orderId) throw new Error('No orderId in Stripe session.');

  const paymentReference = session.payment_intent || session.subscription || session.id;

  await updatePaymentRecord(orderId, {
    status: 'completed',
    reference: String(paymentReference),
    stripeSessionId: session.id,
    stripeCustomerId: session.customer || null,
    stripeSubscriptionId: session.subscription || null,
    testMode: false,
  });

  return confirmPaymentServer(orderId, String(paymentReference), {
    stripeSessionId: session.id,
    stripeCustomerId: session.customer || null,
    stripeSubscriptionId: session.subscription || null,
    paymentGateway: 'stripe',
  });
}
