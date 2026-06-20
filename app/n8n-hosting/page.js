'use client';

import { useRouter } from 'next/navigation';
import PublicLayout from '@/components/layout/PublicLayout';
import { PricingCard } from '@/components/home/PricingCard';
import { PageHeader } from '@/components/ui';
import { N8N_PACKAGES } from '@/data/constants';
import { useCart } from '@/contexts/CartContext';
import { createServiceCartItem } from '@/lib/cart/helpers';

export default function N8nHostingPage() {
  const { addItem } = useCart();
  const router = useRouter();

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <PageHeader
          title="n8n Automation Hosting"
          description="Managed n8n instances with SSL, automatic updates, and dedicated resources."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {N8N_PACKAGES.map((pkg) => (
            <PricingCard
              key={pkg.id}
              pkg={pkg}
              onAddToCart={async (p) => { await addItem(createServiceCartItem(p, 'n8n')); router.push('/cart'); }}
            />
          ))}
        </div>
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-8">
          <h2 className="text-xl font-semibold text-white mb-4">Why host n8n with us?</h2>
          <ul className="grid md:grid-cols-2 gap-4 text-sm text-neutral-400">
            {['Pre-configured n8n with SSL', 'Automatic backups', 'Custom domain support', 'Priority support on Pro plans'].map((f) => (
              <li key={f} className="flex items-center gap-2"><span className="text-white">✓</span>{f}</li>
            ))}
          </ul>
        </div>
      </div>
    </PublicLayout>
  );
}
