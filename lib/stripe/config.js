import Stripe from 'stripe';

let stripeClient = null;

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured.');
  }
  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }
  return stripeClient;
}

export function getStripePublishableKey() {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
}
