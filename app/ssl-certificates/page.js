'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PublicLayout from '@/components/layout/PublicLayout';
import { SslPricingCard } from '@/components/home/PricingCard';
import { PageHeader, Button } from '@/components/ui';
import { SSL_PACKAGES, TEMP_SSL_INFO } from '@/data/ssl-certificates';
import { CHECKOUT_TAX_PER_PACKAGE, formatCurrency } from '@/lib/billing/helpers';
import { useCart } from '@/contexts/CartContext';
import { createSslCartItem } from '@/lib/cart/helpers';

export default function SslCertificatesPage() {
  const { addItem } = useCart();
  const router = useRouter();

  const handleAdd = async (pkg) => {
    await addItem(createSslCartItem(pkg));
    router.push('/cart');
  };

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <PageHeader
          title="SSL Certificates"
          description="Annual SSL plans from $49/year. Every order includes a free temporary SSL while your certificate is issued."
        />

        <div className="bg-neutral-950 border border-emerald-900/40 rounded-2xl p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-2">Temporary SSL included on every order</h2>
          <p className="text-neutral-400 mb-4 max-w-2xl">{TEMP_SSL_INFO.description}</p>
          <p className="text-sm text-emerald-400">
            Installed via {TEMP_SSL_INFO.provider} within {TEMP_SSL_INFO.installTime}.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {SSL_PACKAGES.map((pkg) => (
            <SslPricingCard key={pkg.id} pkg={pkg} onAddToCart={handleAdd} />
          ))}
        </div>

        <div className="text-center">
          <Link href="/ssl-certificates-pricing">
            <Button variant="secondary">Compare plans & checkout tax</Button>
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
