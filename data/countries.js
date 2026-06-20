export const COUNTRIES = [
  { code: 'LK', name: 'Sri Lanka' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'IN', name: 'India' },
  { code: 'AU', name: 'Australia' },
  { code: 'CA', name: 'Canada' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'SG', name: 'Singapore' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'JP', name: 'Japan' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'TH', name: 'Thailand' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'OTHER', name: 'Other' },
];

export const PAYMENT_GATEWAYS = {
  geniebiz: {
    id: 'geniebiz',
    name: 'GenieBiz',
    label: 'GenieBiz (Sri Lanka)',
    description: 'Pay in LKR via GenieBiz payment link — cards, bank transfer, and mobile wallets.',
    region: 'Sri Lanka',
  },
  stripe: {
    id: 'stripe',
    name: 'Stripe',
    label: 'Stripe',
    description: 'Pay securely with international credit and debit cards via Stripe.',
    region: 'International',
  },
};

export function getCountryByCode(code) {
  return COUNTRIES.find((c) => c.code === code) || null;
}

export function getCountryName(code) {
  return getCountryByCode(code)?.name || code;
}

export function isSriLanka(countryCode) {
  return countryCode === 'LK';
}

export function getPaymentGatewayForCountry(countryCode) {
  if (isSriLanka(countryCode)) {
    return PAYMENT_GATEWAYS.geniebiz;
  }
  return PAYMENT_GATEWAYS.stripe;
}

export function isPaymentTestMode() {
  return process.env.NEXT_PUBLIC_PAYMENT_TEST_MODE !== 'false';
}
