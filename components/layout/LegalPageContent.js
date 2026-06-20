'use client';

import { useEffect, useState } from 'react';
import { getLegalPage } from '@/lib/firebase/firestore';
import { LEGAL_PAGES } from '@/data/constants';
import { LoadingSpinner } from '@/components/ui';

const DEFAULT_CONTENT = {
  'privacy-policy': {
    title: 'Privacy Policy',
    sections: [
      { heading: 'Information We Collect', body: 'We collect account information (name, email, phone), billing details, service configuration data, and usage logs necessary to operate your hosting services.' },
      { heading: 'How We Use Information', body: 'Your data is used to provision services, process orders, send invoices, provide support, and improve platform reliability. We do not sell personal data to third parties.' },
      { heading: 'Data Security', body: 'We implement industry-standard security measures including encrypted connections, access controls, and regular monitoring of our infrastructure.' },
      { heading: 'Contact', body: 'For privacy inquiries, contact us through the Contact page or open a support ticket from your dashboard.' },
    ],
  },
  terms: {
    title: 'Terms and Conditions',
    sections: [
      { heading: 'Acceptance', body: 'By using Feed Forge, you agree to these Terms and Conditions and our Acceptable Use Policy.' },
      { heading: 'Services', body: 'We provide EC2 hosting, pay-as-you-go servers, n8n automation hosting, AI website builder, and AI chatbot services as described on our website.' },
      { heading: 'Payment', body: 'All services require payment confirmation before provisioning. Orders remain pending until payment is verified by our payment provider or admin team.' },
      { heading: 'Termination', body: 'We may suspend or terminate services for violations of our Acceptable Use Policy or non-payment after the grace period.' },
    ],
  },
  'refund-policy': {
    title: 'Refund Policy',
    sections: [
      { heading: 'Eligibility', body: 'Refunds may be requested within 30 days of initial purchase for eligible services that have not been fully utilized.' },
      { heading: 'Non-Refundable Items', body: 'Usage-based charges, domain registrations, and services marked as non-refundable at purchase are excluded.' },
      { heading: 'Process', body: 'Submit a refund request via support ticket with your order number. Approved refunds are processed within 5–10 business days.' },
    ],
  },
  sla: {
    title: 'Service Level Agreement',
    sections: [
      { heading: 'Uptime Commitment', body: 'We target 99.9% network uptime for EC2 services measured monthly, excluding scheduled maintenance.' },
      { heading: 'Maintenance', body: 'Scheduled maintenance is announced at least 24 hours in advance when possible.' },
      { heading: 'Credits', body: 'Service credits may be issued for verified downtime exceeding SLA thresholds. Contact support to request review.' },
    ],
  },
  'acceptable-use': {
    title: 'Acceptable Use Policy',
    sections: [
      { heading: 'Prohibited Activities', body: 'You may not use our services for illegal activities, spam, malware distribution, DDoS attacks, or copyright infringement.' },
      { heading: 'Resource Usage', body: 'Excessive resource usage affecting other customers may result in throttling or suspension.' },
      { heading: 'Enforcement', body: 'Violations may result in immediate suspension without refund. Repeat offenders may be permanently banned.' },
    ],
  },
};

export default function LegalPageContent({ slug }) {
  const meta = LEGAL_PAGES[slug] || { title: 'Legal', slug };
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const firestoreContent = await getLegalPage(slug);
        if (firestoreContent?.sections?.length) {
          setContent(firestoreContent);
        } else if (firestoreContent?.body) {
          setContent(firestoreContent);
        } else {
          setContent(DEFAULT_CONTENT[slug] || { title: meta.title, sections: [{ heading: meta.title, body: 'Content coming soon.' }] });
        }
      } catch {
        setContent(DEFAULT_CONTENT[slug] || { title: meta.title, sections: [{ heading: meta.title, body: 'Content coming soon.' }] });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug, meta.title]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  const title = content?.title || meta.title;

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8">{title}</h1>
      {content?.body ? (
        <div className="prose prose-invert max-w-none text-neutral-300 whitespace-pre-wrap leading-relaxed">
          {content.body}
        </div>
      ) : (
        <div className="space-y-8">
          {(content?.sections || []).map((section, i) => (
            <section key={i}>
              <h2 className="text-xl font-semibold text-white mb-3">{section.heading}</h2>
              <p className="text-neutral-400 leading-relaxed">{section.body}</p>
            </section>
          ))}
        </div>
      )}
      <p className="mt-12 text-sm text-neutral-500">Last updated: {content?.updatedAt ? 'See admin panel' : 'Default version'}</p>
    </article>
  );
}
