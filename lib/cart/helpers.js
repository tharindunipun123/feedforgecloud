const CART_STORAGE_KEY = 'quantumserver_cart';

export function getGuestCart() {
  if (typeof window === 'undefined') return { items: [], updatedAt: null };
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : { items: [], updatedAt: null };
  } catch {
    return { items: [], updatedAt: null };
  }
}

export function saveGuestCart(cart) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(
    CART_STORAGE_KEY,
    JSON.stringify({ ...cart, updatedAt: new Date().toISOString() })
  );
}

export function clearGuestCart() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CART_STORAGE_KEY);
}

export function validateCartItem(item) {
  if (!item || !item.type || !item.name) return false;
  if (item.type === 'ec2' && !item.packageId) return false;
  if (item.type === 'payg' && !item.config) return false;
  if (['n8n', 'ai-website', 'ai-chatbot', 'cdn_hosting'].includes(item.type) && !item.packageId) return false;
  return true;
}

export function generateCartItemId() {
  return `item_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function calculateCartSubtotal(items, billingCycle = 'monthly') {
  return items.reduce((sum, item) => {
    const qty = item.quantity || 1;
    let price = item.price || 0;
    if (billingCycle === 'annual' && item.type !== 'payg') {
      price = price * 10;
    }
    return sum + price * qty;
  }, 0);
}

export function createVpsCartItem(pkg, options = {}) {
  return {
    id: generateCartItemId(),
    type: 'ec2',
    packageId: pkg.id,
    name: pkg.name,
    price: pkg.monthlyPrice,
    renewalPrice: pkg.renewalPrice,
    quantity: 1,
    billingCycle: options.billingCycle || 'monthly',
    config: {
      os: options.os || 'Ubuntu 22.04 LTS',
      location: options.location || 'us-east',
      vcpu: pkg.vcpu,
      ram: pkg.ram,
      storage: pkg.storage,
      bandwidth: pkg.bandwidth,
    },
  };
}

export function createPaygCartItem(config, prices) {
  return {
    id: generateCartItemId(),
    type: 'payg',
    packageId: 'payg-ec2',
    name: `Pay-as-you-go EC2 (${config.vcpu} vCPU, ${config.ram} GB RAM)`,
    price: prices.monthly,
    hourlyRate: prices.hourly,
    quantity: 1,
    billingCycle: 'hourly',
    config: {
      ...config,
      os: config.os || 'Ubuntu 22.04 LTS',
      location: config.location || 'us-east',
    },
  };
}

export function createServiceCartItem(pkg, type) {
  return {
    id: generateCartItemId(),
    type,
    packageId: pkg.id,
    name: pkg.name,
    price: pkg.monthlyPrice,
    renewalPrice: pkg.renewalPrice,
    quantity: 1,
    billingCycle: 'monthly',
    config: {},
  };
}

export function createCdnCartItem(pkg) {
  return {
    id: generateCartItemId(),
    type: 'cdn_hosting',
    packageId: pkg.id,
    name: pkg.name,
    price: pkg.monthlyPrice,
    renewalPrice: pkg.renewalPrice,
    quantity: 1,
    billingCycle: 'monthly',
    config: {
      storageCredits: pkg.storageCredits,
      bandwidthCredits: pkg.bandwidthCredits,
    },
  };
}
