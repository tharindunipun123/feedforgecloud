export const GENIEBIZ_EC2_PAYMENTS = {
  'starter-ec2': {
    packageId: 'starter-ec2',
    planName: 'Starter EC2',
    amountLkr: 6000,
    payLink: 'https://paylink.geniebiz.lk/LoGJXNN0zZ',
  },
  'business-ec2': {
    packageId: 'business-ec2',
    planName: 'Business EC2',
    amountLkr: 11200,
    payLink: 'https://paylink.geniebiz.lk/xJbnawwB3o',
  },
  'pro-ec2': {
    packageId: 'pro-ec2',
    planName: 'Pro EC2',
    amountLkr: 16500,
    payLink: 'https://paylink.geniebiz.lk/3Q5QaqP1K1',
  },
  'enterprise-ec2': {
    packageId: 'enterprise-ec2',
    planName: 'Enterprise EC2',
    amountLkr: 22300,
    payLink: 'https://paylink.geniebiz.lk/NwrBxKX8A4',
  },
};

export function formatLkr(amount) {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getGenieBizPaymentForPackage(packageId) {
  return GENIEBIZ_EC2_PAYMENTS[packageId] || null;
}

/** Single monthly EC2 package carts qualify for GenieBiz pay links. */
export function resolveGenieBizCheckout(items, billingCycle = 'monthly') {
  if (billingCycle !== 'monthly') {
    return {
      eligible: false,
      error: 'GenieBiz payments are available for monthly EC2 plans only. Switch to monthly billing or use an international country for Stripe.',
    };
  }

  if (!items?.length) {
    return { eligible: false, error: 'Your cart is empty.' };
  }

  if (items.length !== 1) {
    return {
      eligible: false,
      error: 'GenieBiz payments support one EC2 plan per order. Remove extra items or complete separate checkouts.',
    };
  }

  const item = items[0];
  if (item.type !== 'ec2') {
    return {
      eligible: false,
      error: 'GenieBiz is available for EC2 hosting plans only. For other services, select a non–Sri Lanka country to pay with Stripe.',
    };
  }

  if ((item.quantity || 1) !== 1) {
    return {
      eligible: false,
      error: 'GenieBiz supports one EC2 instance per order.',
    };
  }

  const payment = getGenieBizPaymentForPackage(item.packageId);
  if (!payment) {
    return {
      eligible: false,
      error: 'No GenieBiz payment link is configured for this EC2 plan.',
    };
  }

  return { eligible: true, payment, item };
}
