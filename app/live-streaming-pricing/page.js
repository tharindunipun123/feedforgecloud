'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PublicLayout from '@/components/layout/PublicLayout';
import { StreamingPricingCard } from '@/components/home/PricingCard';
import { PageHeader, Button } from '@/components/ui';
import { STREAMING_PACKAGES, STREAMING_PAYG_RATES } from '@/data/streaming';
import { useCart } from '@/contexts/CartContext';
import { createStreamingCartItem } from '@/lib/cart/helpers';
import { formatCurrency } from '@/lib/billing/helpers';

export default function LiveStreamingPricingPage() {
  const { addItem } = useCart();
  const router = useRouter();

  const handleAdd = async (pkg) => {
    await addItem(createStreamingCartItem(pkg));
    router.push('/cart');
  };

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <PageHeader
          title="Live Streaming Pricing"
          description="All plans include tax. Monthly billing via Stripe. Enable pay-as-you-go overages at checkout."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {STREAMING_PACKAGES.map((pkg) => (
            <StreamingPricingCard key={pkg.id} pkg={pkg} onAddToCart={handleAdd} />
          ))}
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-8 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Pay-as-you-go overage rates</h2>
          <p className="text-neutral-400 text-sm mb-6">
            Enable PAYG during checkout to bill extra usage beyond your package limits at the end of each billing period.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="bg-black border border-neutral-800 rounded-lg p-4">
              <p className="text-neutral-500 text-xs mb-1">Extra listeners</p>
              <p className="text-white font-medium">{formatCurrency(STREAMING_PAYG_RATES.extraListeners)}/listener/hr</p>
            </div>
            <div className="bg-black border border-neutral-800 rounded-lg p-4">
              <p className="text-neutral-500 text-xs mb-1">Extra bandwidth</p>
              <p className="text-white font-medium">{formatCurrency(STREAMING_PAYG_RATES.extraBandwidthGb)}/GB</p>
            </div>
            <div className="bg-black border border-neutral-800 rounded-lg p-4">
              <p className="text-neutral-500 text-xs mb-1">Extra stream hours</p>
              <p className="text-white font-medium">{formatCurrency(STREAMING_PAYG_RATES.extraStreamHour)}/hr</p>
            </div>
            <div className="bg-black border border-neutral-800 rounded-lg p-4">
              <p className="text-neutral-500 text-xs mb-1">Recording storage</p>
              <p className="text-white font-medium">{formatCurrency(STREAMING_PAYG_RATES.storageGb)}/GB/mo</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link href="/live-streaming"><Button variant="secondary">Learn about live streaming</Button></Link>
        </div>
      </div>
    </PublicLayout>
  );
}
