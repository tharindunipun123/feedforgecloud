/** SSL certificate packages — annual billing only */

export const SSL_CERT_TYPES = [
  { id: 'dv', label: 'Domain Validation (DV)' },
  { id: 'ov', label: 'Organization Validation (OV)' },
];

export const SSL_PACKAGES = [
  {
    id: 'ssl-standard',
    slug: 'ssl-standard',
    name: 'Standard SSL',
    type: 'ssl_certificate',
    annualPrice: 225,
    renewalPrice: 225,
    validation: 'Domain Validation (DV)',
    validationType: 'dv',
    domains: '1 domain',
    wildcard: false,
    popular: false,
    annualOnly: true,
    features: [
      'Single domain certificate',
      'Domain Validation (DV)',
      '256-bit encryption',
      'Browser-trusted CA',
      'HTTPS padlock & SEO boost',
      '1-year validity',
      'Renewal reminders',
      'Email support',
    ],
  },
  {
    id: 'ssl-premium',
    slug: 'ssl-premium',
    name: 'Premium SSL',
    type: 'ssl_certificate',
    annualPrice: 275,
    renewalPrice: 275,
    validation: 'Organization Validation (OV)',
    validationType: 'ov',
    domains: 'Wildcard or multi-domain',
    wildcard: true,
    popular: true,
    annualOnly: true,
    features: [
      'Wildcard or multi-domain',
      'Organization Validation (OV)',
      '256-bit encryption',
      'Priority issuance',
      'Dynamic site seal',
      '1-year validity',
      'Priority support',
      'Certificate reissue included',
    ],
  },
];

export function getSslPackageById(id) {
  return SSL_PACKAGES.find((p) => p.id === id);
}

export function getSslPackageBySlug(slug) {
  return SSL_PACKAGES.find((p) => p.slug === slug);
}
