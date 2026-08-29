/** SSL certificate packages — annual billing only, temporary SSL on all orders */

export const SSL_CERT_TYPES = [
  { id: 'dv', label: 'Domain Validation (DV)' },
  { id: 'ov', label: 'Organization Validation (OV)' },
  { id: 'cdn', label: 'CDN + SSL Bundle' },
];

export const TEMP_SSL_INFO = {
  provider: 'Let\'s Encrypt',
  installTime: '10–15 minutes after payment',
  description:
    'Every SSL order includes a free temporary SSL certificate installed on your domain while your annual certificate is issued.',
};

/** Annual prices in USD. $3.50/package tax added at checkout. */
export const SSL_PACKAGES = [
  {
    id: 'ssl-certificate',
    slug: 'ssl-certificate',
    name: 'SSL Certificate',
    type: 'ssl_certificate',
    annualPrice: 49,
    renewalPrice: 49,
    validation: 'Domain Validation (DV)',
    validationType: 'dv',
    domains: '1 domain',
    wildcard: false,
    tempSslIncluded: true,
    includesCdn: false,
    popular: false,
    annualOnly: true,
    features: [
      'Temporary SSL installed first (free)',
      'Single domain DV certificate',
      '256-bit encryption',
      'Browser-trusted CA',
      'HTTPS padlock & SEO boost',
      '1-year validity',
      'Email support',
    ],
  },
  {
    id: 'ssl-installation',
    slug: 'ssl-installation',
    name: 'SSL Installation & Setup',
    type: 'ssl_certificate',
    annualPrice: 60,
    renewalPrice: 60,
    validation: 'Full installation service',
    validationType: 'dv',
    domains: '1 domain + setup',
    wildcard: false,
    tempSslIncluded: true,
    includesCdn: false,
    popular: false,
    annualOnly: true,
    features: [
      'Temporary SSL installed first (free)',
      'Professional SSL installation',
      'Server configuration & HTTPS redirect',
      'Certificate deployment on your host',
      'Mixed content fixes',
      '1-year service included',
      'Priority support',
    ],
  },
  {
    id: 'ssl-cdn-bundle',
    slug: 'super-fast-cdn-ssl',
    name: 'Super Fast CDN With SSL',
    type: 'ssl_certificate',
    annualPrice: 210,
    renewalPrice: 210,
    validation: 'CDN + SSL bundle',
    validationType: 'cdn',
    domains: 'Custom domain + CDN edge',
    wildcard: true,
    tempSslIncluded: true,
    includesCdn: true,
    cdnPlanId: 'cdn-growth',
    popular: true,
    annualOnly: true,
    features: [
      'Temporary SSL installed first (free)',
      'Global CDN edge delivery',
      'SSL on all CDN endpoints',
      '50 GB bandwidth credits',
      '20 GB storage credits',
      'Priority SSL + CDN provisioning',
      '1-year bundle validity',
    ],
  },
];

export function getSslPackageById(id) {
  return SSL_PACKAGES.find((p) => p.id === id);
}

export function getSslPackageBySlug(slug) {
  return SSL_PACKAGES.find((p) => p.slug === slug);
}

export function buildSslServiceConfig(itemConfig = {}) {
  return {
    ...itemConfig,
    tempSsl: {
      status: 'pending',
      provider: TEMP_SSL_INFO.provider,
      requestedAt: new Date().toISOString(),
      message: TEMP_SSL_INFO.description,
    },
  };
}
