'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PublicLayout from '@/components/layout/PublicLayout';
import { StreamingPricingCard } from '@/components/home/PricingCard';
import { PageHeader, Button } from '@/components/ui';
import { STREAMING_PACKAGES, STREAMING_STACK, STREAMING_REGIONS } from '@/data/streaming';
import { useCart } from '@/contexts/CartContext';
import { createStreamingCartItem } from '@/lib/cart/helpers';

export default function LiveStreamingPage() {
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
          title="Live Audio Streaming"
          description="Dedicated Node.js streaming servers with Icecast2 and Liquidsoap. From $165/mo — tax included."
        />

        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-8 mb-12">
          <h2 className="text-xl font-bold text-white mb-2">{STREAMING_STACK.name}</h2>
          <p className="text-neutral-400 mb-4 max-w-2xl">{STREAMING_STACK.description}</p>
          <div className="flex flex-wrap gap-2">
            {STREAMING_STACK.components.map((c) => (
              <span key={c} className="px-3 py-1 text-xs rounded-full border border-neutral-700 text-neutral-300">
                {c}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {STREAMING_PACKAGES.map((pkg) => (
            <StreamingPricingCard key={pkg.id} pkg={pkg} onAddToCart={handleAdd} />
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Global regions</h3>
            <ul className="space-y-2 text-sm text-neutral-400">
              {STREAMING_REGIONS.map((r) => (
                <li key={r.id} className="flex items-center gap-2">
                  <span className="text-white">{r.flag}</span> {r.name}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">How it works</h3>
            <ol className="space-y-3 text-sm text-neutral-400 list-decimal list-inside">
              <li>Register with organization & BR number</li>
              <li>Choose a package and select your streaming region</li>
              <li>Pay via Stripe — service enters pending provisioning</li>
              <li>Receive stream URL, mount point & credentials in dashboard</li>
            </ol>
          </div>
        </div>

        <div className="text-center">
          <Link href="/live-streaming-pricing">
            <Button variant="secondary">Compare all plans</Button>
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
