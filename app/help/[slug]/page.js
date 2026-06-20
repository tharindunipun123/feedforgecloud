'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import PublicLayout from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui';
import { HELP_ARTICLES } from '@/data/constants';

const ARTICLE_CONTENT = {
  'getting-started-ec2': {
    body: `Welcome to Feed Forge EC2 hosting. After your payment is confirmed, your EC2 instance will be provisioned within 10–15 minutes.

1. Log in to your dashboard
2. Navigate to My Services → EC2 Services
3. View your service credentials once status is Active
4. Connect via SSH using the provided IP, username, and password

For security, change your root password immediately after first login.`,
  },
  'connect-via-ssh': {
    body: `To connect to your EC2 instance via SSH:

1. Open a terminal on your computer
2. Run: ssh username@your-server-ip
3. Enter your password when prompted
4. Default SSH port is 22 unless configured otherwise

On Windows, you can use PuTTY or Windows Terminal with OpenSSH.`,
  },
  'n8n-setup-guide': {
    body: `Your n8n instance is pre-configured after provisioning. Access it via the URL provided in your dashboard credentials.

1. Log in with the admin credentials from your dashboard
2. Create your first workflow
3. Configure webhooks and integrations
4. Set up your custom domain if on Pro plan`,
  },
  'billing-and-invoices': {
    body: `Invoices are generated after payment confirmation or when usage charges are created. Default payment terms are 7 days.

View all invoices in Dashboard → Invoices. Download PDF copies for your records. Unpaid invoices become overdue after the due date.`,
  },
  'dns-configuration': {
    body: `Point your domain to your EC2 instance by updating DNS records at your registrar:

- A record: point to your EC2 IP address
- CNAME: alias subdomains to your main domain
- MX: configure email if needed

Use our DNS Lookup tool to verify propagation.`,
  },
};

export default function HelpArticlePage() {
  const { slug } = useParams();
  const article = HELP_ARTICLES.find((a) => a.slug === slug);
  const content = ARTICLE_CONTENT[slug];

  if (!article) {
    return (
      <PublicLayout>
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Article not found</h1>
          <Link href="/help"><Button>Back to Help Center</Button></Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Link href="/help" className="text-sm text-neutral-400 hover:text-white mb-6 inline-block">← Help Center</Link>
        <span className="text-xs text-neutral-500 uppercase tracking-wide">{article.category}</span>
        <h1 className="text-3xl font-bold text-white mt-2 mb-4">{article.title}</h1>
        <p className="text-neutral-400 mb-8">{article.excerpt}</p>
        <div className="prose prose-invert max-w-none text-neutral-300 whitespace-pre-wrap leading-relaxed">
          {content?.body || 'Full article content coming soon.'}
        </div>
      </article>
    </PublicLayout>
  );
}
