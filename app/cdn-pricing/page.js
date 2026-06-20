'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PublicLayout from '@/components/layout/PublicLayout';
import CdnPlanCard from '@/components/cdn/CdnPlanCard';
import { PageHeader, Button } from '@/components/ui';
import { CDN_PLANS } from '@/data/cdn';
import { useCart } from '@/contexts/CartContext';
import { createCdnCartItem } from '@/lib/cart/helpers';

export default function CdnPricingPage() {
  const { addItem } = useCart();
  const router = useRouter();

  const handleAddToCart = async (plan) => {
    await addItem(createCdnCartItem(plan));
    router.push('/cart');
  };

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <PageHeader
          title="CDN Pricing"
          description="Credit-based CDN hosting with monthly storage and bandwidth allowances. All plans include API access."
          action={
            <Link href="/cdn-hosting">
              <Button variant="secondary" size="sm">Learn more</Button>
            </Link>
          }
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {CDN_PLANS.map((plan) => (
            <CdnPlanCard key={plan.id} plan={plan} onAddToCart={handleAddToCart} />
          ))}
        </div>
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-8">
          <h2 className="text-xl font-semibold text-white mb-4">How credits work</h2>
          <ul className="grid md:grid-cols-2 gap-4 text-sm text-neutral-400">
            {[
              'Storage credits are consumed when you upload files (1 credit = 1 MB, rounded up)',
              'Bandwidth credits are used when files are delivered to end users',
              'Credits reset monthly on the first day of each billing cycle',
              'Unused credits do not roll over to the next month',
            ].map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span className="text-white shrink-0">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PublicLayout>
  );
}
