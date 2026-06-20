import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  generateInvoiceNumber,
  calculateDueDate,
  calculateTax,
  calculateTotal,
  DEFAULT_PAYMENT_TERMS_DAYS,
} from '@/lib/billing/helpers';
import { sortByCreatedAt } from '@/lib/firebase/query-helpers';
import { getDefaultServiceOnDemand, mergeOnDemandSettings } from '@/data/on-demand';

function getDb() {
  if (!db) throw new Error('Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* env variables.');
  return db;
}

export async function createUserDocument(user, name) {
  const userRef = doc(getDb(), 'users', user.uid);
  const existing = await getDoc(userRef);
  if (existing.exists()) return existing.data();

  const userData = {
    uid: user.uid,
    name: name || user.displayName || '',
    email: user.email,
    role: 'user',
    createdAt: serverTimestamp(),
  };
  await setDoc(userRef, userData);
  return userData;
}

export async function getUserData(uid) {
  const userRef = doc(getDb(), 'users', uid);
  const snap = await getDoc(userRef);
  return snap.exists() ? snap.data() : null;
}

export async function logAdminAction(adminId, action, details = {}) {
  await addDoc(collection(getDb(), 'adminLogs'), {
    adminId,
    action,
    details,
    createdAt: serverTimestamp(),
  });
}

export async function createOrder(userId, orderData) {
  const orderRef = await addDoc(collection(getDb(), 'orders'), {
    userId,
    ...orderData,
    status: 'pending_payment',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  if (orderData.items?.length) {
    for (const item of orderData.items) {
      await addDoc(collection(getDb(), 'orderItems'), {
        orderId: orderRef.id,
        userId,
        ...item,
        createdAt: serverTimestamp(),
      });
    }
  }

  return orderRef.id;
}

export async function createPaymentRecord(paymentData) {
  const paymentRef = await addDoc(collection(getDb(), 'payments'), {
    ...paymentData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return paymentRef.id;
}

export async function processCheckoutPayment(userId, orderData, gateway, options = {}) {
  const countryCode = orderData.customer?.countryCode;
  const countryName = orderData.customer?.country;

  const orderId = await createOrder(userId, {
    ...orderData,
    countryCode,
    country: countryName,
    paymentGateway: gateway.id,
    paymentGatewayName: gateway.name,
    paymentGatewayLabel: gateway.label,
    ...(options.geniebizPayLink
      ? {
          geniebizPayLink: options.geniebizPayLink,
          geniebizAmountLkr: options.geniebizAmountLkr,
          displayCurrency: 'LKR',
        }
      : {}),
  });

  const paymentReference = options.paymentReference || `${gateway.id.toUpperCase()}-${Date.now()}`;

  if (options.testMode) {
    await createPaymentRecord({
      userId,
      orderId,
      gateway: gateway.id,
      gatewayName: gateway.name,
      amount: orderData.total,
      currency: orderData.currency || 'USD',
      status: 'completed_test',
      reference: paymentReference,
      countryCode,
      country: countryName,
      testMode: true,
    });

    await confirmPayment(orderId, paymentReference, options.adminId || null);
  } else {
    const isGenieBiz = gateway.id === 'geniebiz';
    await createPaymentRecord({
      userId,
      orderId,
      gateway: gateway.id,
      gatewayName: gateway.name,
      amount: isGenieBiz ? options.geniebizAmountLkr : orderData.total,
      currency: isGenieBiz ? 'LKR' : orderData.currency || 'USD',
      status: 'pending',
      reference: null,
      countryCode,
      country: countryName,
      testMode: false,
      ...(isGenieBiz && options.geniebizPayLink
        ? { geniebizPayLink: options.geniebizPayLink }
        : {}),
    });
  }

  return { orderId, paymentReference };
}

export async function confirmPayment(orderId, paymentReference, adminId = null) {
  const orderRef = doc(getDb(), 'orders', orderId);
  const orderSnap = await getDoc(orderRef);
  if (!orderSnap.exists()) throw new Error('Order not found');

  const order = orderSnap.data();

  await updateDoc(orderRef, {
    status: 'payment_confirmed',
    paymentReference,
    paidAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const invoiceId = await createInvoiceFromOrder(orderId, order, paymentReference);
  const serviceIds = await createServicesFromOrder(orderId, order);

  if (adminId) {
    await logAdminAction(adminId, 'confirm_payment', { orderId, paymentReference });
  }

  return { invoiceId, serviceIds };
}

export async function createInvoiceFromOrder(orderId, order, paymentReference = null) {
  const invoiceNumber = generateInvoiceNumber();
  const issueDate = new Date();
  const dueDate = calculateDueDate(issueDate, DEFAULT_PAYMENT_TERMS_DAYS);

  const invoiceRef = await addDoc(collection(getDb(), 'invoices'), {
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
    currency: 'USD',
    status: paymentReference ? 'paid' : 'unpaid',
    issueDate: serverTimestamp(),
    dueDate,
    paidDate: paymentReference ? serverTimestamp() : null,
    billingPeriodStart: serverTimestamp(),
    billingPeriodEnd: null,
    paymentReference,
    notes: '',
    createdAt: serverTimestamp(),
  });

  return invoiceRef.id;
}

export async function createServicesFromOrder(orderId, order) {
  const serviceIds = [];
  const items = order.items || [];

  for (const item of items) {
    const isCdn = item.type === 'cdn_hosting';
    const serviceRef = await addDoc(collection(getDb(), 'services'), {
      userId: order.userId,
      orderId,
      name: item.name,
      type: item.type,
      packageId: item.packageId,
      status: 'provisioning',
      billingStatus: 'active',
      billingCycle: item.billingCycle || 'monthly',
      config: item.config || {},
      credentials: null,
      onDemandUsage: getDefaultServiceOnDemand(),
      nextRenewalDate: null,
      activatedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    serviceIds.push(serviceRef.id);

    if (isCdn) {
      const { createCdnSubscription } = await import('@/lib/firebase/cdn');
      await createCdnSubscription(order.userId, serviceRef.id, orderId, item.packageId);
    }
  }

  return serviceIds;
}

export async function getUserServices(userId) {
  const q = query(collection(getDb(), 'services'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return sortByCreatedAt(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
}

export async function getUserInvoices(userId) {
  const q = query(collection(getDb(), 'invoices'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return sortByCreatedAt(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
}

export async function getUserTickets(userId) {
  const q = query(collection(getDb(), 'tickets'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return sortByCreatedAt(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
}

export async function getUserReminders(userId) {
  const q = query(collection(getDb(), 'renewalReminders'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return sortByCreatedAt(snap.docs.map((d) => ({ id: d.id, ...d.data() }))).slice(0, 10);
}

export async function saveCartToFirestore(userId, cart) {
  await setDoc(doc(getDb(), 'carts', userId), {
    items: cart.items || [],
    coupon: cart.coupon || null,
    billingCycle: cart.billingCycle || 'monthly',
    updatedAt: serverTimestamp(),
  });
}

export async function getCartFromFirestore(userId) {
  const snap = await getDoc(doc(getDb(), 'carts', userId));
  return snap.exists() ? snap.data() : { items: [], billingCycle: 'monthly' };
}

export async function createUsageCharge(chargeData, adminId) {
  const chargeRef = await addDoc(collection(getDb(), 'usageCharges'), {
    ...chargeData,
    status: 'pending',
    createdAt: serverTimestamp(),
  });

  const invoiceNumber = generateInvoiceNumber();
  const issueDate = new Date();
  const dueDate = calculateDueDate(issueDate, DEFAULT_PAYMENT_TERMS_DAYS);
  const subtotal = chargeData.amount || 0;
  const tax = calculateTax(subtotal, 0);
  const total = calculateTotal(subtotal, tax, 0);

  const invoiceRef = await addDoc(collection(getDb(), 'invoices'), {
    invoiceNumber,
    userId: chargeData.userId,
    orderId: null,
    serviceId: chargeData.serviceId,
    invoiceType: 'usage',
    lineItems: [
      {
        name: chargeData.description || 'Usage charge',
        amount: subtotal,
        periodStart: chargeData.periodStart,
        periodEnd: chargeData.periodEnd,
      },
    ],
    subtotal,
    tax,
    discount: 0,
    total,
    currency: 'USD',
    status: 'unpaid',
    issueDate: serverTimestamp(),
    dueDate,
    paidDate: null,
    billingPeriodStart: chargeData.periodStart,
    billingPeriodEnd: chargeData.periodEnd,
    paymentReference: null,
    notes: chargeData.notes || '',
    usageChargeId: chargeRef.id,
    createdAt: serverTimestamp(),
  });

  await updateDoc(chargeRef, { invoiceId: invoiceRef.id, status: 'invoiced' });
  await logAdminAction(adminId, 'create_usage_charge', { chargeId: chargeRef.id, invoiceId: invoiceRef.id });

  return { chargeId: chargeRef.id, invoiceId: invoiceRef.id };
}

export async function updateUserProfile(uid, data) {
  await updateDoc(doc(getDb(), 'users', uid), { ...data, updatedAt: serverTimestamp() });
}

export async function getAllUsers() {
  const snap = await getDocs(query(collection(getDb(), 'users'), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getUserOrders(userId) {
  const q = query(collection(getDb(), 'orders'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return sortByCreatedAt(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
}

export async function getAllOrders() {
  const snap = await getDocs(query(collection(getDb(), 'orders'), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getOrder(orderId) {
  const snap = await getDoc(doc(getDb(), 'orders', orderId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getService(serviceId) {
  const snap = await getDoc(doc(getDb(), 'services', serviceId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getAllServices() {
  const snap = await getDocs(query(collection(getDb(), 'services'), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function updateService(serviceId, data, adminId = null) {
  await updateDoc(doc(getDb(), 'services', serviceId), { ...data, updatedAt: serverTimestamp() });
  if (adminId) await logAdminAction(adminId, 'update_service', { serviceId, ...data });
}

export async function cancelService(serviceId, userId) {
  await updateDoc(doc(getDb(), 'services', serviceId), {
    status: 'cancelled',
    billingStatus: 'cancelled',
    cancelledAt: serverTimestamp(),
    cancelledBy: userId,
    updatedAt: serverTimestamp(),
  });
  await addDoc(collection(getDb(), 'serviceEvents'), {
    serviceId,
    userId,
    type: 'cancelled',
    message: 'Service cancelled by user.',
    createdAt: serverTimestamp(),
  });
}

export async function requestServiceRestart(serviceId, userId) {
  await addDoc(collection(getDb(), 'serviceEvents'), {
    serviceId,
    userId,
    type: 'restart_requested',
    message: 'Restart requested by user.',
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(getDb(), 'services', serviceId), {
    restartRequested: true,
    restartRequestedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getServiceEvents(serviceId) {
  const q = query(
    collection(getDb(), 'serviceEvents'),
    where('serviceId', '==', serviceId),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getInvoice(invoiceId) {
  const snap = await getDoc(doc(getDb(), 'invoices', invoiceId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getAllInvoices() {
  const snap = await getDocs(query(collection(getDb(), 'invoices'), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getOverdueInvoices() {
  const snap = await getDocs(query(collection(getDb(), 'invoices'), where('status', '==', 'unpaid')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createTicket(userId, ticketData) {
  const ref = await addDoc(collection(getDb(), 'tickets'), {
    userId,
    ...ticketData,
    status: 'open',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getTicket(ticketId) {
  const snap = await getDoc(doc(getDb(), 'tickets', ticketId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getAllTickets() {
  const snap = await getDocs(query(collection(getDb(), 'tickets'), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function updateTicket(ticketId, data) {
  await updateDoc(doc(getDb(), 'tickets', ticketId), { ...data, updatedAt: serverTimestamp() });
}

export async function getTicketMessages(ticketId) {
  const q = query(collection(getDb(), 'ticketMessages'), where('ticketId', '==', ticketId));
  const snap = await getDocs(q);
  return sortByCreatedAt(
    snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    'asc'
  );
}

export async function addTicketMessage(ticketId, messageData) {
  await addDoc(collection(getDb(), 'ticketMessages'), {
    ticketId,
    ...messageData,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(getDb(), 'tickets', ticketId), { updatedAt: serverTimestamp() });
}

export async function getLegalPage(slug) {
  const snap = await getDoc(doc(getDb(), 'legalPages', slug));
  return snap.exists() ? snap.data() : null;
}

export async function saveLegalPage(slug, data, adminId) {
  await setDoc(doc(getDb(), 'legalPages', slug), {
    slug,
    ...data,
    updatedAt: serverTimestamp(),
  });
  if (adminId) await logAdminAction(adminId, 'update_legal_page', { slug });
}

export async function getAdminLogs() {
  const snap = await getDocs(query(collection(getDb(), 'adminLogs'), orderBy('createdAt', 'desc'), limit(100)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getPlatformSettings() {
  const snap = await getDoc(doc(getDb(), 'settings', 'general'));
  return snap.exists() ? snap.data() : {};
}

export async function savePlatformSettings(data, adminId) {
  await setDoc(doc(getDb(), 'settings', 'general'), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  if (adminId) await logAdminAction(adminId, 'update_settings', data);
}

export async function getOnDemandSettings() {
  const platform = await getPlatformSettings();
  return mergeOnDemandSettings(platform);
}

export async function saveOnDemandSettings(onDemandData, adminId) {
  const current = await getPlatformSettings();
  await savePlatformSettings(
    { ...current, onDemandUsage: { ...(current.onDemandUsage || {}), ...onDemandData } },
    adminId
  );
}

export async function getUserUsageCharges(userId) {
  const q = query(collection(getDb(), 'usageCharges'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return sortByCreatedAt(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
}

export async function toggleServiceOnDemandUsage(serviceId, userId, enabled) {
  const service = await getService(serviceId);
  if (!service || service.userId !== userId) {
    throw new Error('Service not found or access denied.');
  }

  const platform = await getPlatformSettings();
  const settings = mergeOnDemandSettings(platform);

  if (!settings.globallyEnabled) {
    throw new Error('On-demand usage is currently disabled platform-wide.');
  }
  if (!settings.userCanEnable && enabled) {
    throw new Error('Self-service on-demand usage is disabled. Contact support.');
  }
  if (!settings.eligibleTypes.includes(service.type)) {
    throw new Error('This service type does not support on-demand usage.');
  }
  if (service.onDemandUsage?.adminLocked && enabled) {
    throw new Error('On-demand usage has been disabled for this service by an administrator.');
  }

  const onDemandUsage = {
    ...(service.onDemandUsage || getDefaultServiceOnDemand()),
    enabled,
    enabledAt: enabled ? serverTimestamp() : null,
    enabledBy: enabled ? 'user' : service.onDemandUsage?.enabledBy,
  };

  await updateDoc(doc(getDb(), 'services', serviceId), {
    onDemandUsage,
    updatedAt: serverTimestamp(),
  });

  await addDoc(collection(getDb(), 'serviceEvents'), {
    serviceId,
    userId,
    type: enabled ? 'on_demand_enabled' : 'on_demand_disabled',
    message: enabled ? 'On-demand usage enabled by user.' : 'On-demand usage disabled by user.',
    createdAt: serverTimestamp(),
  });

  return onDemandUsage;
}

export async function updateServiceOnDemandAdmin(serviceId, data, adminId) {
  const service = await getService(serviceId);
  if (!service) throw new Error('Service not found.');

  const onDemandUsage = {
    ...(service.onDemandUsage || getDefaultServiceOnDemand()),
    ...data,
  };

  if (data.enabled === true) {
    onDemandUsage.enabledAt = serverTimestamp();
    onDemandUsage.enabledBy = 'admin';
  }
  if (data.enabled === false && data.adminLocked) {
    onDemandUsage.enabledAt = null;
  }

  await updateService(serviceId, { onDemandUsage }, adminId);
  return onDemandUsage;
}

export { calculateTax, calculateTotal };
