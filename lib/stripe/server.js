import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import { getDefaultServiceOnDemand } from '@/data/on-demand';
import { getStripe } from '@/lib/stripe/config';
import {
  generateInvoiceNumber,
  calculateDueDate,
  calculateNextRenewalDate,
  DEFAULT_PAYMENT_TERMS_DAYS,
} from '@/lib/billing/helpers';
import {
  queuePurchaseConfirmationEmail,
  queueRenewalPaidEmail,
} from '@/lib/email/notifications';

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
    const existing = await db.collection('services').where('orderId', '==', orderId).get();
    if (!existing.empty) {
      return {
        alreadyConfirmed: true,
        orderId,
        serviceIds: existing.docs.map((d) => d.id),
      };
    }
    const serviceIds = await createServicesFromOrderServer(orderId, order, extra);
    queuePurchaseConfirmationEmail({ orderId, order, invoiceId: null });
    return { orderId, serviceIds, recovered: true };
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

  queuePurchaseConfirmationEmail({ orderId, order, invoiceId });

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
  const existing = await db.collection('services').where('orderId', '==', orderId).get();
  if (!existing.empty) {
    return existing.docs.map((d) => d.id);
  }

  const serviceIds = [];
  const items = order.items || [];
  const billingCycle = order.billingCycle || 'monthly';

  for (const item of items) {
    const isSsl = item.type === 'ssl_certificate';
    const itemCycle = item.billingCycle || billingCycle;
    const renewalDate = new Date();
    if (itemCycle === 'annual' || item.type === 'ssl_certificate') {
      renewalDate.setFullYear(renewalDate.getFullYear() + 1);
    } else {
      renewalDate.setMonth(renewalDate.getMonth() + 1);
    }

    const serviceRef = await db.collection('services').add({
      userId: order.userId,
      orderId,
      name: item.name,
      type: item.type,
      packageId: item.packageId,
      status: 'provisioning',
      billingStatus: 'pending',
      billingCycle: itemCycle,
      config: {
        ...(item.config || {}),
        organizationName: order.customer?.organizationName || '',
        brNumber: order.customer?.brNumber || '',
        organizationAddress: order.customer?.organizationAddress || '',
        ...(isSsl
          ? {
              tempSsl: {
                status: 'pending',
                provider: 'Let\'s Encrypt',
                message: 'Temporary SSL will be installed within 15 minutes.',
              },
            }
          : {}),
      },
      credentials: null,
      onDemandUsage: getDefaultServiceOnDemand(),
      nextRenewalDate: renewalDate,
      activatedAt: null,
      stripeSubscriptionId: extra.stripeSubscriptionId || null,
      stripeCustomerId: extra.stripeCustomerId || null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    serviceIds.push(serviceRef.id);
  }

  if (serviceIds.length > 0) {
    const invoiceSnap = await db.collection('invoices').where('orderId', '==', orderId).limit(1).get();
    if (!invoiceSnap.empty) {
      await invoiceSnap.docs[0].ref.update({ serviceId: serviceIds[0] });
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
  const hasSsl = items.some((item) => item.type === 'ssl_certificate');
  const isSubscription = !hasSsl && items.every((item) => item.type !== 'payg');

  const lineItems = items.map((item) => {
    let unitAmount = Math.round((item.price || 0) * 100);
    if (item.type === 'ssl_certificate' || item.annualOnly) {
      unitAmount = Math.round((item.price || 0) * 100);
    } else if (billingCycle === 'annual' && item.type !== 'payg') {
      unitAmount = Math.round(unitAmount * 10);
    }

    const itemInterval =
      item.type === 'ssl_certificate' || item.annualOnly || item.billingCycle === 'annual'
        ? 'year'
        : billingCycle === 'annual'
          ? 'year'
          : 'month';

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
      lineItem.price_data.recurring = { interval: itemInterval };
    }

    return lineItem;
  });

  const taxInterval = isSubscription
    ? billingCycle === 'annual' || hasSsl
      ? 'year'
      : 'month'
    : undefined;

  if (order.tax > 0) {
    lineItems.push({
      price_data: {
        currency: (order.currency || 'USD').toLowerCase(),
        product_data: { name: 'Checkout tax ($3.50 per package)' },
        unit_amount: Math.round(order.tax * 100),
        ...(isSubscription && taxInterval ? { recurring: { interval: taxInterval } } : {}),
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

export async function createInvoiceCheckoutSession({ invoiceId, invoice, userEmail, successUrl, cancelUrl }) {
  const stripe = getStripe();
  const lineItems = (invoice.lineItems || []).map((item) => ({
    price_data: {
      currency: (invoice.currency || 'USD').toLowerCase(),
      product_data: { name: item.name || item.description || 'Service renewal' },
      unit_amount: Math.round((item.amount || item.price || 0) * 100),
    },
    quantity: 1,
  }));

  if (invoice.tax > 0) {
    lineItems.push({
      price_data: {
        currency: (invoice.currency || 'USD').toLowerCase(),
        product_data: { name: 'Checkout tax ($3.50 per package)' },
        unit_amount: Math.round(invoice.tax * 100),
      },
      quantity: 1,
    });
  }

  const sessionParams = {
    mode: 'payment',
    line_items: lineItems,
    customer_email: userEmail,
    client_reference_id: invoiceId,
    metadata: {
      type: 'renewal',
      invoiceId,
      userId: invoice.userId,
      serviceId: invoice.serviceId || '',
    },
    payment_intent_data: {
      metadata: {
        type: 'renewal',
        invoiceId,
        userId: invoice.userId,
        serviceId: invoice.serviceId || '',
      },
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
  };

  return stripe.checkout.sessions.create(sessionParams);
}

export async function confirmRenewalPaymentServer(invoiceId, paymentReference, extra = {}) {
  const db = getDb();
  const invoiceRef = db.collection('invoices').doc(invoiceId);
  const invoiceSnap = await invoiceRef.get();
  if (!invoiceSnap.exists) throw new Error('Invoice not found');

  const invoice = invoiceSnap.data();
  if (invoice.status === 'paid') {
    return { alreadyConfirmed: true, invoiceId, serviceId: invoice.serviceId || null };
  }

  await invoiceRef.update({
    status: 'paid',
    paidDate: FieldValue.serverTimestamp(),
    paymentReference: String(paymentReference),
    updatedAt: FieldValue.serverTimestamp(),
  });

  if (invoice.serviceId) {
    const serviceRef = db.collection('services').doc(invoice.serviceId);
    const serviceSnap = await serviceRef.get();
    if (serviceSnap.exists) {
      const service = serviceSnap.data();
      const previousRenewal = service.nextRenewalDate?.toDate
        ? service.nextRenewalDate.toDate()
        : service.nextRenewalDate
          ? new Date(service.nextRenewalDate)
          : new Date();
      const nextRenewalDate = calculateNextRenewalDate(
        service.activatedAt || new Date(),
        service.billingCycle || 'monthly',
        previousRenewal
      );

      await serviceRef.update({
        billingStatus: 'active',
        status: service.status === 'suspended' ? 'active' : service.status,
        nextRenewalDate,
        lastRenewedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }

  const paymentSnap = await db.collection('payments')
    .where('invoiceId', '==', invoiceId)
    .limit(1)
    .get();

  if (!paymentSnap.empty) {
    await paymentSnap.docs[0].ref.update({
      status: 'completed',
      reference: String(paymentReference),
      stripeSessionId: extra.stripeSessionId || null,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else {
    await db.collection('payments').add({
      userId: invoice.userId,
      invoiceId,
      serviceId: invoice.serviceId || null,
      gateway: 'stripe',
      gatewayName: 'Stripe',
      amount: invoice.total || 0,
      currency: invoice.currency || 'USD',
      status: 'completed',
      reference: String(paymentReference),
      paymentType: 'renewal',
      stripeSessionId: extra.stripeSessionId || null,
      testMode: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  let renewedService = null;
  if (invoice.serviceId) {
    const renewedSnap = await db.collection('services').doc(invoice.serviceId).get();
    if (renewedSnap.exists) renewedService = { id: renewedSnap.id, ...renewedSnap.data() };
  }

  const paidInvoiceSnap = await invoiceRef.get();
  queueRenewalPaidEmail({
    invoiceId,
    invoice: paidInvoiceSnap.data(),
    service: renewedService,
  });

  return { invoiceId, serviceId: invoice.serviceId || null, renewed: true };
}

export async function updateRenewalPaymentRecord(invoiceId, data) {
  const db = getDb();
  const snap = await db.collection('payments').where('invoiceId', '==', invoiceId).limit(1).get();
  if (snap.empty) return;
  await snap.docs[0].ref.update({ ...data, updatedAt: FieldValue.serverTimestamp() });
}

export async function handleStripeCheckoutComplete(session) {
  if (session.metadata?.type === 'renewal') {
    const invoiceId = session.metadata?.invoiceId || session.client_reference_id;
    if (!invoiceId) throw new Error('No invoiceId in Stripe renewal session.');

    const paymentReference = session.payment_intent || session.id;

    await updateRenewalPaymentRecord(invoiceId, {
      status: 'completed',
      reference: String(paymentReference),
      stripeSessionId: session.id,
      stripeCustomerId: session.customer || null,
      testMode: false,
    });

    return confirmRenewalPaymentServer(invoiceId, String(paymentReference), {
      stripeSessionId: session.id,
      stripeCustomerId: session.customer || null,
      paymentGateway: 'stripe',
    });
  }

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
