export const BRAND_NAME = 'Feed Forge';

export const SERVER_LOCATIONS = [
  { id: 'us-east', name: 'US East (New York)', flag: 'US' },
  { id: 'us-west', name: 'US West (Los Angeles)', flag: 'US' },
  { id: 'eu-central', name: 'EU Central (Frankfurt)', flag: 'EU' },
  { id: 'eu-west', name: 'EU West (London)', flag: 'EU' },
  { id: 'asia-sg', name: 'Asia (Singapore)', flag: 'SG' },
  { id: 'asia-tokyo', name: 'Asia (Tokyo)', flag: 'JP' },
];

export const OS_OPTIONS = [
  'Ubuntu 22.04 LTS',
  'Ubuntu 24.04 LTS',
  'Debian 12',
  'CentOS Stream 9',
  'Rocky Linux 9',
  'Windows Server 2022',
];

export const BILLING_CYCLES = [
  { id: 'monthly', label: 'Monthly', multiplier: 1 },
  { id: 'annual', label: 'Annual', multiplier: 10 },
];

export const EC2_PACKAGES = [
  {
    id: 'starter-ec2',
    slug: 'starter-ec2',
    name: 'Starter EC2',
    type: 'ec2',
    monthlyPrice: 19,
    renewalPrice: 24.99,
    vcpu: 1,
    ram: '2 GB',
    storage: '40 GB NVMe',
    bandwidth: '2 TB',
    popular: false,
    features: ['1 vCPU', '2 GB RAM', '40 GB NVMe', '2 TB bandwidth', 'Full root access', 'DDoS protection'],
  },
  {
    id: 'business-ec2',
    slug: 'business-ec2',
    name: 'Business EC2',
    type: 'ec2',
    monthlyPrice: 35,
    renewalPrice: 42.99,
    vcpu: 2,
    ram: '4 GB',
    storage: '80 GB NVMe',
    bandwidth: '4 TB',
    popular: true,
    features: ['2 vCPU', '4 GB RAM', '80 GB NVMe', '4 TB bandwidth', 'Daily backups', 'Priority support'],
  },
  {
    id: 'pro-ec2',
    slug: 'pro-ec2',
    name: 'Pro EC2',
    type: 'ec2',
    monthlyPrice: 55,
    renewalPrice: 64.99,
    vcpu: 4,
    ram: '8 GB',
    storage: '160 GB NVMe',
    bandwidth: '8 TB',
    popular: false,
    features: ['4 vCPU', '8 GB RAM', '160 GB NVMe', '8 TB bandwidth', 'Snapshots', 'Dedicated IP'],
  },
  {
    id: 'enterprise-ec2',
    slug: 'enterprise-ec2',
    name: 'Enterprise EC2',
    type: 'ec2',
    monthlyPrice: 75,
    renewalPrice: 89.99,
    vcpu: 8,
    ram: '16 GB',
    storage: '320 GB NVMe',
    bandwidth: '16 TB',
    popular: false,
    features: ['8 vCPU', '16 GB RAM', '320 GB NVMe', '16 TB bandwidth', 'SLA 99.9%', 'Account manager'],
  },
];

export const N8N_PACKAGES = [
  {
    id: 'n8n-starter',
    name: 'n8n Starter',
    type: 'n8n',
    monthlyPrice: 14.99,
    renewalPrice: 14.99,
    workflows: 10,
    executions: '5,000/mo',
    features: ['10 active workflows', '5,000 executions/month', 'SSL included', 'Auto updates'],
  },
  {
    id: 'n8n-pro',
    name: 'n8n Pro',
    type: 'n8n',
    monthlyPrice: 29.99,
    renewalPrice: 29.99,
    workflows: 50,
    executions: '25,000/mo',
    popular: true,
    features: ['50 active workflows', '25,000 executions/month', 'Custom domain', 'Priority support'],
  },
  {
    id: 'n8n-enterprise',
    name: 'n8n Enterprise',
    type: 'n8n',
    monthlyPrice: 59.99,
    renewalPrice: 59.99,
    workflows: 'Unlimited',
    executions: '100,000/mo',
    features: ['Unlimited workflows', '100,000 executions/month', 'Dedicated instance', 'SLA support'],
  },
];

export const AI_WEBSITE_PACKAGES = [
  {
    id: 'ai-website-free',
    name: 'AI Website Free',
    type: 'ai-website',
    monthlyPrice: 0,
    renewalPrice: 0,
    pages: 1,
    generationsPerMonth: 5,
    isFree: true,
    features: ['1 page', '5 AI generations/month', 'Mobile responsive', 'HTML export'],
  },
  {
    id: 'ai-website-basic',
    name: 'AI Website Basic',
    type: 'ai-website',
    monthlyPrice: 12.99,
    renewalPrice: 12.99,
    pages: 5,
    generationsPerMonth: 30,
    features: ['5 pages', '30 AI generations/month', 'Mobile responsive', 'SSL certificate', 'Custom domain'],
  },
  {
    id: 'ai-website-pro',
    name: 'AI Website Pro',
    type: 'ai-website',
    monthlyPrice: 24.99,
    renewalPrice: 24.99,
    pages: 20,
    generationsPerMonth: -1,
    popular: true,
    features: ['20 pages', 'Unlimited AI generations', 'SEO optimization', 'Custom domain', 'Priority support'],
  },
];

export const AI_CHATBOT_PACKAGES = [
  {
    id: 'ai-chatbot-starter',
    name: 'AI Chatbot Starter',
    type: 'ai-chatbot',
    monthlyPrice: 19.99,
    renewalPrice: 19.99,
    messages: '2,000/mo',
    features: ['2,000 messages/month', 'Website widget', 'Basic analytics', 'Email support'],
  },
  {
    id: 'ai-chatbot-business',
    name: 'AI Chatbot Business',
    type: 'ai-chatbot',
    monthlyPrice: 49.99,
    renewalPrice: 49.99,
    messages: '10,000/mo',
    popular: true,
    features: ['10,000 messages/month', 'Multi-channel', 'Custom branding', 'API access'],
  },
];

export const PAYG_RATES = {
  vcpu: 0.012,
  ram: 0.008,
  storage: 0.0001,
  bandwidth: 0.01,
};

export const PAYG_OPTIONS = {
  vcpu: [1, 2, 4, 8, 16],
  ram: [2, 4, 8, 16, 32],
  storage: [40, 80, 160, 320, 640],
  bandwidth: ['2 TB', '4 TB', '8 TB', '16 TB', '32 TB'],
};

export const TICKET_CATEGORIES = [
  'Billing',
  'Technical',
  'Sales',
  'Account',
  'Other',
];

export const TICKET_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

export const TICKET_STATUSES = ['open', 'in_progress', 'waiting', 'resolved', 'closed'];

export const FAQ_ITEMS = [
  {
    question: 'How long does EC2 provisioning take?',
    answer: 'EC2 provisioning usually takes 10–15 minutes after payment confirmation. Credentials are sent to your email and dashboard.',
  },
  {
    question: 'Can I upgrade my EC2 plan later?',
    answer: 'Yes. You can upgrade your EC2 plan at any time from your dashboard. Upgrades are applied with minimal downtime.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We support major credit cards and bank transfers. Payment is confirmed via our payment provider or manual admin verification.',
  },
  {
    question: 'Do you offer refunds?',
    answer: 'Refunds are available within 30 days for eligible services. See our Refund Policy for full details.',
  },
  {
    question: 'Is there a setup fee?',
    answer: 'No setup fees on standard EC2 plans. Pay-as-you-go EC2 is billed based on usage with no upfront commitment.',
  },
  {
    question: 'Where are your servers located?',
    answer: 'We operate data centers in the US, EU, and Asia regions. Choose your preferred location during checkout.',
  },
];

export const HELP_ARTICLES = [
  {
    slug: 'getting-started-ec2',
    title: 'Getting Started with EC2 Hosting',
    category: 'EC2 Hosting',
    excerpt: 'Learn how to deploy and manage your first EC2 instance on Feed Forge.',
  },
  {
    slug: 'connect-via-ssh',
    title: 'Connect to Your EC2 Instance via SSH',
    category: 'EC2 Hosting',
    excerpt: 'Step-by-step guide to connect to your EC2 instance using SSH credentials.',
  },
  {
    slug: 'n8n-setup-guide',
    title: 'Setting Up n8n Automation',
    category: 'n8n Hosting',
    excerpt: 'Configure your n8n instance and create your first workflow.',
  },
  {
    slug: 'billing-and-invoices',
    title: 'Understanding Billing and Invoices',
    category: 'Billing',
    excerpt: 'How invoices, renewals, and payment terms work on our platform.',
  },
  {
    slug: 'dns-configuration',
    title: 'DNS Configuration Guide',
    category: 'DNS',
    excerpt: 'Configure DNS records for domains pointing to your services.',
  },
];

export const LEGAL_PAGES = {
  'privacy-policy': {
    title: 'Privacy Policy',
    slug: 'privacy-policy',
  },
  terms: {
    title: 'Terms and Conditions',
    slug: 'terms',
  },
  'refund-policy': {
    title: 'Refund Policy',
    slug: 'refund-policy',
  },
  sla: {
    title: 'Service Level Agreement',
    slug: 'sla',
  },
  'acceptable-use': {
    title: 'Acceptable Use Policy',
    slug: 'acceptable-use',
  },
};

export const NAV_SERVICES = [
  { href: '/ec2-hosting', label: 'EC2 Hosting' },
  { href: '/pay-as-you-go', label: 'Pay-as-you-go EC2' },
  { href: '/n8n-hosting', label: 'n8n Automation Hosting' },
  { href: '/ai-website-builder', label: 'AI Website Builder' },
  { href: '/ai-chatbot', label: 'AI Chatbot Service' },
  { href: '/cdn-hosting', label: 'CDN & Media Hosting' },
  { href: '/dns-lookup', label: 'DNS Lookup' },
  { href: '/whois-lookup', label: 'WHOIS Lookup' },
];

export function getPackageBySlug(slug) {
  return EC2_PACKAGES.find((p) => p.slug === slug);
}

export function calculatePaygPrice(config) {
  const { vcpu = 1, ram = 2, storage = 40, bandwidth = '2 TB' } = config;
  const bwMultiplier = parseInt(bandwidth) || 2;
  const hourly =
    vcpu * PAYG_RATES.vcpu +
    ram * PAYG_RATES.ram +
    storage * PAYG_RATES.storage +
    bwMultiplier * PAYG_RATES.bandwidth;
  return {
    hourly: hourly,
    daily: hourly * 24,
    monthly: hourly * 24 * 30,
  };
}
