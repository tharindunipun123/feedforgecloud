export const KB_CATEGORIES = [
  { id: 'getting-started', name: 'Getting Started', description: 'Account setup, first steps, and platform overview.' },
  { id: 'ec2-hosting', name: 'EC2 Hosting', description: 'Deploy, manage, and scale EC2 instances.' },
  { id: 'cdn-media', name: 'CDN & Media', description: 'Upload, deliver, and manage media assets globally.' },
  { id: 'billing-account', name: 'Billing & Account', description: 'Invoices, payments, renewals, and account settings.' },
  { id: 'domains-dns', name: 'Domains & DNS', description: 'DNS records, domain tools, and configuration guides.' },
  { id: 'legal-policies', name: 'Legal & Policies', description: 'Privacy, refunds, terms, SLA, and acceptable use.' },
];

export const KNOWLEDGE_BASE_ARTICLES = [
  {
    slug: 'platform-overview',
    title: 'Feed Forge Platform Overview',
    category: 'getting-started',
    excerpt: 'Learn what services are available and how the platform works.',
    readTime: '5 min',
  },
  {
    slug: 'create-your-first-order',
    title: 'How to Create Your First Order',
    category: 'getting-started',
    excerpt: 'Add services to cart, checkout, and access your dashboard.',
    readTime: '4 min',
  },
  {
    slug: 'dashboard-navigation',
    title: 'Navigating Your Dashboard',
    category: 'getting-started',
    excerpt: 'Overview of services, billing, support, and CDN tools.',
    readTime: '3 min',
  },
  {
    slug: 'getting-started-ec2',
    title: 'Getting Started with EC2 Hosting',
    category: 'ec2-hosting',
    excerpt: 'Provision and access your first EC2 instance after payment confirmation.',
    readTime: '6 min',
  },
  {
    slug: 'connect-via-ssh',
    title: 'Connect to Your EC2 Instance via SSH',
    category: 'ec2-hosting',
    excerpt: 'Secure shell access on Linux, macOS, and Windows.',
    readTime: '4 min',
  },
  {
    slug: 'ec2-backups-snapshots',
    title: 'EC2 Backups and Snapshots',
    category: 'ec2-hosting',
    excerpt: 'Protect your data with backup best practices.',
    readTime: '5 min',
  },
  {
    slug: 'payg-ec2-billing',
    title: 'Pay-as-you-go EC2 Billing Explained',
    category: 'ec2-hosting',
    excerpt: 'How hourly usage and monthly estimates work.',
    readTime: '4 min',
  },
  {
    slug: 'cdn-getting-started',
    title: 'Getting Started with CDN & Media Hosting',
    category: 'cdn-media',
    excerpt: 'Subscribe to a CDN plan, upload media, and use API keys.',
    readTime: '5 min',
  },
  {
    slug: 'cdn-credits-explained',
    title: 'Understanding CDN Credits',
    category: 'cdn-media',
    excerpt: 'How storage credits work, monthly resets, and upgrades.',
    readTime: '3 min',
  },
  {
    slug: 'cdn-api-upload',
    title: 'Upload Media via CDN API',
    category: 'cdn-media',
    excerpt: 'Authenticate and upload files programmatically.',
    readTime: '6 min',
  },
  {
    slug: 'n8n-setup-guide',
    title: 'Setting Up n8n Automation',
    category: 'ec2-hosting',
    excerpt: 'Configure your n8n instance and first workflow.',
    readTime: '5 min',
  },
  {
    slug: 'billing-and-invoices',
    title: 'Understanding Billing and Invoices',
    category: 'billing-account',
    excerpt: 'Payment terms, renewals, overdue invoices, and PDF downloads.',
    readTime: '5 min',
  },
  {
    slug: 'payment-methods',
    title: 'Payment Methods by Country',
    category: 'billing-account',
    excerpt: 'GenieBiz for Sri Lanka EC2 plans, Stripe for international customers.',
    readTime: '3 min',
  },
  {
    slug: 'account-password-security',
    title: 'Account Password and Security',
    category: 'billing-account',
    excerpt: 'Change password, reset via email, and secure your account.',
    readTime: '3 min',
  },
  {
    slug: 'dns-configuration',
    title: 'DNS Configuration Guide',
    category: 'domains-dns',
    excerpt: 'Configure A, CNAME, MX, and TXT records for your domain.',
    readTime: '6 min',
  },
  {
    slug: 'domain-availability-check',
    title: 'How Domain Availability Checking Works',
    category: 'domains-dns',
    excerpt: 'Use our domain checker and understand registration status.',
    readTime: '3 min',
  },
  {
    slug: 'privacy-policy-guide',
    title: 'Privacy Policy — What We Collect and Why',
    category: 'legal-policies',
    excerpt: 'Summary of data collection, usage, and your rights.',
    readTime: '4 min',
    legalLink: '/privacy-policy',
  },
  {
    slug: 'refund-policy-guide',
    title: 'Refund Policy — Eligibility and Process',
    category: 'legal-policies',
    excerpt: 'When refunds apply and how to submit a request.',
    readTime: '4 min',
    legalLink: '/refund-policy',
  },
  {
    slug: 'terms-guide',
    title: 'Terms and Conditions Overview',
    category: 'legal-policies',
    excerpt: 'Key terms for using Feed Forge services.',
    readTime: '5 min',
    legalLink: '/terms',
  },
  {
    slug: 'sla-guide',
    title: 'Service Level Agreement Summary',
    category: 'legal-policies',
    excerpt: 'Uptime commitments and support response expectations.',
    readTime: '3 min',
    legalLink: '/sla',
  },
  {
    slug: 'acceptable-use-guide',
    title: 'Acceptable Use Policy Summary',
    category: 'legal-policies',
    excerpt: 'Prohibited activities and enforcement guidelines.',
    readTime: '4 min',
    legalLink: '/acceptable-use',
  },
];

export function getKbArticle(slug) {
  return KNOWLEDGE_BASE_ARTICLES.find((a) => a.slug === slug);
}

export function getKbArticlesByCategory(categoryId) {
  return KNOWLEDGE_BASE_ARTICLES.filter((a) => a.category === categoryId);
}

export function getKbCategory(id) {
  return KB_CATEGORIES.find((c) => c.id === id);
}

export const KB_ARTICLE_CONTENT = {
  'platform-overview': {
    sections: [
      { heading: 'What is Feed Forge?', body: 'Feed Forge is a hosting platform offering EC2 hosting, pay-as-you-go servers, n8n automation, AI website builder, AI chatbot services, and CDN media hosting with integrated billing, support, and admin tools.' },
      { heading: 'Core services', body: 'EC2 Hosting — fixed plans with NVMe storage and global locations.\nPay-as-you-go EC2 — hourly billing with custom resources.\nn8n Hosting — managed automation instances.\nAI Website Builder & AI Chatbot — AI-powered web services.\nCDN & Media Hosting — credit-based global media delivery.' },
      { heading: 'Getting help', body: 'Use the Knowledge Base, Tutorials, Help Center, live chat, or support tickets from your dashboard.' },
    ],
  },
  'privacy-policy-guide': {
    sections: [
      { heading: 'Overview', body: 'We collect account information, billing details, and service usage data necessary to operate your hosting services. We do not sell personal data to third parties.' },
      { heading: 'Your rights', body: 'You may request access, correction, or deletion of your personal data by contacting support or opening a ticket from your dashboard.' },
      { heading: 'Full policy', body: 'Read the complete Privacy Policy for detailed information about data retention, cookies, and third-party processors.' },
    ],
  },
  'refund-policy-guide': {
    sections: [
      { heading: 'Eligibility', body: 'Refunds may be requested within 30 days of initial purchase for eligible services that have not been fully utilized.' },
      { heading: 'Non-refundable', body: 'Usage-based charges, domain registrations, and services marked non-refundable at purchase are excluded.' },
      { heading: 'How to request', body: 'Open a support ticket with your order number. Approved refunds are processed within 5–10 business days.' },
    ],
  },
  'terms-guide': {
    sections: [
      { heading: 'Acceptance', body: 'By creating an account or purchasing services, you agree to our Terms and Conditions governing use of Feed Forge.' },
      { heading: 'Service use', body: 'You are responsible for content hosted on your EC2 instance, CDN assets, and automation workflows. Prohibited use includes spam, malware, and illegal activity.' },
      { heading: 'Full terms', body: 'See the complete Terms and Conditions page for billing, suspension, and termination policies.' },
    ],
  },
  'dns-configuration': {
    sections: [
      { heading: 'Common records', body: 'A — points a domain to an IPv4 address.\nAAAA — points to IPv6.\nCNAME — aliases one hostname to another.\nMX — mail server routing.\nTXT — verification and SPF/DKIM records.' },
      { heading: 'Pointing to your EC2 instance', body: 'Create an A record at your registrar pointing @ and www to your EC2 IP from Dashboard → My Services.' },
      { heading: 'Verify propagation', body: 'Use our DNS Lookup tool to confirm records are live before going to production.' },
    ],
  },
  'cdn-getting-started': {
    sections: [
      { heading: 'Subscribe to a plan', body: 'Choose a CDN plan from CDN Pricing, complete checkout, and access Dashboard → CDN Hosting.' },
      { heading: 'Upload media', body: 'Use the dashboard upload zone or REST API with your API key. Each upload consumes credits (1 credit = 1 MB).' },
      { heading: 'Deliver globally', body: 'Assets are served from our worldwide CDN edge network shown on the homepage map.' },
    ],
  },
  'create-your-first-order': {
    sections: [
      { heading: 'Browse services', body: 'Explore EC2, pay-as-you-go, n8n, AI services, and CDN plans from the homepage or navigation menu.' },
      { heading: 'Add to cart', body: 'Select a plan and add it to your cart. You can combine multiple services in one checkout.' },
      { heading: 'Complete payment', body: 'Sign in or register, enter billing details, and pay via GenieBiz (Sri Lanka EC2) or Stripe (international).' },
    ],
  },
};

export const NAV_TOOLS = [
  { href: '/dns-lookup', label: 'DNS Lookup' },
  { href: '/whois-lookup', label: 'WHOIS Lookup' },
  { href: '/domain-check', label: 'Domain Availability Check' },
];

export const NAV_SUPPORT = [
  { href: '/help', label: 'Help Center' },
  { href: '/knowledge-base', label: 'Knowledge Base' },
  { href: '/tutorials', label: 'Tutorials' },
  { href: '/contact', label: 'Contact Us' },
];

export const NAV_PRICING = [
  { href: '/ec2-pricing', label: 'EC2 Pricing' },
  { href: '/cdn-pricing', label: 'CDN Pricing' },
  { href: '/pay-as-you-go', label: 'Pay-as-you-go EC2' },
];
