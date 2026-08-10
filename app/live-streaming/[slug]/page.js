'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import PublicLayout from '@/components/layout/PublicLayout';
import { Button, Card } from '@/components/ui';
import { getStreamingPackageBySlug, STREAMING_REGIONS } from '@/data/streaming';
import { useCart } from '@/contexts/CartContext';
import { createStreamingCartItem } from '@/lib/cart/helpers';
import { formatCurrency } from '@/lib/billing/helpers';

export default function LiveStreamingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCart();
  const pkg = getStreamingPackageBySlug(params.slug);

  if (!pkg) {
    return (
      <PublicLayout>
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl text-white mb-4">Plan not found</h1>
          <Link href="/live-streaming-pricing"><Button>View pricing</Button></Link>
        </div>
      </PublicLayout>
    );
  }

  const handleAdd = async () => {
    await addItem(createStreamingCartItem(pkg));
    router.push('/cart');
  };

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Link href="/live-streaming-pricing" className="text-sm text-neutral-400 hover:text-white mb-6 inline-block">
          ← All streaming plans
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{pkg.name}</h1>
          <p className="text-neutral-400">
            {formatCurrency(pkg.monthlyPrice)}/mo · tax included · Node.js + Icecast2 + Liquidsoap
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <h2 className="text-white font-semibold mb-4">Package limits</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <dt className="text-neutral-400">Concurrent listeners</dt>
                <dd className="text-white">{pkg.maxListeners?.toLocaleString()}</dd>
              </div>
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <dt className="text-neutral-400">Live streams</dt>
                <dd className="text-white">{pkg.maxStreams}</dd>
              </div>
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <dt className="text-neutral-400">Bandwidth</dt>
                <dd className="text-white">{pkg.bandwidth}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-400">Max bitrate</dt>
                <dd className="text-white">{pkg.bitrate}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h2 className="text-white font-semibold mb-4">Included features</h2>
            <ul className="space-y-2">
              {pkg.features.map((f) => (
                <li key={f} className="text-sm text-neutral-300 flex gap-2">
                  <span className="text-white">✓</span> {f}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <Card className="mb-8">
          <h2 className="text-white font-semibold mb-3">Available regions</h2>
          <p className="text-neutral-400 text-sm mb-4">Select your preferred region during checkout. Server provisioning is manual after payment.</p>
          <div className="flex flex-wrap gap-2">
            {STREAMING_REGIONS.map((r) => (
              <span key={r.id} className="px-3 py-1 text-xs rounded-full border border-neutral-700 text-neutral-300">
                {r.name}
              </span>
            ))}
          </div>
        </Card>

        <Button size="lg" onClick={handleAdd}>
          Add {pkg.name} to cart — {formatCurrency(pkg.monthlyPrice)}/mo
        </Button>
      </div>
    </PublicLayout>
  );
}
