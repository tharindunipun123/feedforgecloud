'use client';

import Link from 'next/link';
import PublicLayout from '@/components/layout/PublicLayout';
import CdnPlanCard from '@/components/cdn/CdnPlanCard';
import { Button } from '@/components/ui';
import { CDN_PLANS } from '@/data/cdn';
import { useCart } from '@/contexts/CartContext';
import { createCdnCartItem } from '@/lib/cart/helpers';
import { useRouter } from 'next/navigation';

export default function CdnHostingPage() {
  const { addItem } = useCart();
  const router = useRouter();

  const handleAddToCart = async (plan) => {
    await addItem(createCdnCartItem(plan));
    router.push('/cart');
  };

  return (
    <PublicLayout>
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-6">
              Global CDN for images, videos, and files
            </h1>
            <p className="text-lg text-neutral-400 mb-8 leading-relaxed">
              Host and deliver media at scale with credit-based storage and bandwidth. Upload via dashboard or API with instant CDN URLs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/cdn-pricing">
                <Button size="lg">View pricing</Button>
              </Link>
              <Link href="/register">
                <Button variant="secondary" size="lg">Get started</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-4">Why Feed Forge CDN</h2>
          <p className="text-neutral-400 text-center mb-12 max-w-2xl mx-auto">
            Fast delivery, simple pricing, and developer-friendly API access built into every plan.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Credit-based billing', desc: 'Pay for storage and bandwidth with monthly credits that reset each cycle.' },
              { title: 'Instant CDN URLs', desc: 'Every upload gets a public CDN URL ready to embed in your apps.' },
              { title: 'REST API access', desc: 'Upload, list, and delete assets programmatically with API keys.' },
              { title: 'Secure delivery', desc: 'HTTPS-only delivery with file type and size validation per plan.' },
            ].map((f) => (
              <div key={f.title} className="bg-neutral-950 border border-neutral-800 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                <p className="text-neutral-400 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">CDN Plans</h2>
              <p className="text-neutral-400">Choose a plan that fits your storage and bandwidth needs.</p>
            </div>
            <Link href="/cdn-pricing">
              <Button variant="secondary">Compare all plans</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {CDN_PLANS.map((plan) => (
              <CdnPlanCard key={plan.id} plan={plan} onAddToCart={handleAddToCart} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-8 lg:p-12 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Ready to deliver media faster?</h2>
            <p className="text-neutral-400 mb-8 max-w-xl mx-auto">
              Sign up, pick a plan, and start uploading in minutes. API documentation is available in your dashboard.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/cdn-pricing"><Button>View pricing</Button></Link>
              <Link href="/contact"><Button variant="secondary">Contact sales</Button></Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
