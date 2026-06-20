'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PublicLayout from '@/components/layout/PublicLayout';
import { Button, Card } from '@/components/ui';
import { getCdnPlanBySlug, formatCreditsMB } from '@/data/cdn';
import { formatCurrency } from '@/lib/billing/helpers';
import { useCart } from '@/contexts/CartContext';
import { createCdnCartItem } from '@/lib/cart/helpers';

export default function CdnPlanDetailPage() {
  const { slug } = useParams();
  const plan = getCdnPlanBySlug(slug);
  const { addItem } = useCart();
  const router = useRouter();

  if (!plan) {
    return (
      <PublicLayout>
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Plan not found</h1>
          <Link href="/cdn-hosting"><Button>View all CDN plans</Button></Link>
        </div>
      </PublicLayout>
    );
  }

  const handleAdd = async () => {
    await addItem(createCdnCartItem(plan));
    router.push('/cart');
  };

  const specs = [
    ['Storage credits', formatCreditsMB(plan.storageCredits)],
    ['Bandwidth credits', formatCreditsMB(plan.bandwidthCredits)],
    ['Max image size', `${plan.maxImageSizeMB} MB`],
    ['Max video size', `${plan.maxVideoSizeMB} MB`],
    ['Allowed file types', plan.allowedFileTypes[0] === '*' ? 'All types' : plan.allowedFileTypes.length + ' types'],
    ['Billing cycle', 'Monthly'],
  ];

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <Link href="/cdn-hosting" className="text-sm text-neutral-400 hover:text-white mb-4 inline-block">
                ← Back to CDN plans
              </Link>
              <h1 className="text-3xl font-bold text-white mb-2">{plan.name}</h1>
              <p className="text-neutral-400">
                Credit-based CDN hosting with API access and global delivery.
              </p>
            </div>

            <Card>
              <h2 className="text-lg font-semibold text-white mb-4">Specifications</h2>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                {specs.map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2 border-b border-neutral-800">
                    <span className="text-neutral-400">{k}</span>
                    <span className="text-white">{v}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold text-white mb-4">Included features</h2>
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-neutral-300">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </Card>

            {plan.allowedFileTypes[0] !== '*' && (
              <Card>
                <h2 className="text-lg font-semibold text-white mb-4">Allowed MIME types</h2>
                <div className="flex flex-wrap gap-2">
                  {plan.allowedFileTypes.map((t) => (
                    <span key={t} className="px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-300">
                      {t}
                    </span>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <div>
            <Card className="sticky top-8">
              <div className="mb-6">
                <span className="text-3xl font-bold text-white">{formatCurrency(plan.monthlyPrice)}</span>
                <span className="text-neutral-400 text-sm">/mo</span>
                <p className="text-neutral-500 text-xs mt-1">Renews at {formatCurrency(plan.renewalPrice)}/mo</p>
              </div>
              <Button className="w-full mb-3" onClick={handleAdd}>Add to cart</Button>
              <Link href="/cdn-pricing">
                <Button variant="secondary" className="w-full">Compare plans</Button>
              </Link>
              <p className="text-xs text-neutral-500 text-center mt-4">
                Activation is instant after payment confirmation.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
