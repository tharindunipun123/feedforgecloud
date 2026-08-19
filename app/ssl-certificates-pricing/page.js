'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PublicLayout from '@/components/layout/PublicLayout';
import { SslPricingCard } from '@/components/home/PricingCard';
import { PageHeader, Button } from '@/components/ui';
import { SSL_PACKAGES } from '@/data/ssl-certificates';
import { CHECKOUT_TAX_PER_PACKAGE, formatCurrency } from '@/lib/billing/helpers';
import { useCart } from '@/contexts/CartContext';
import { createSslCartItem } from '@/lib/cart/helpers';

export default function SslCertificatesPricingPage() {
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
          title="SSL Certificate Pricing"
          description="Annual billing only. All prices in USD per year plus $3.50 tax at checkout."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-4xl mx-auto">
          {SSL_PACKAGES.map((pkg) => (
            <SslPricingCard key={pkg.id} pkg={pkg} onAddToCart={handleAdd} />
          ))}
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-8 max-w-3xl mx-auto">
          <h2 className="text-lg font-semibold text-white mb-4">Checkout totals (first year)</h2>
          <div className="space-y-3 text-sm">
            {SSL_PACKAGES.map((pkg) => (
              <div key={pkg.id} className="flex justify-between py-2 border-b border-neutral-800 last:border-0">
                <span className="text-neutral-300">{pkg.name}</span>
                <span className="text-white">
                  {formatCurrency(pkg.annualPrice)} + {formatCurrency(CHECKOUT_TAX_PER_PACKAGE)} tax ={' '}
                  <strong>{formatCurrency(pkg.annualPrice + CHECKOUT_TAX_PER_PACKAGE)}</strong>
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-neutral-500 mt-4">
            SSL certificates are billed annually only. Renewal is due after 1 year at the same plan rate plus checkout tax.
          </p>
        </div>

        <div className="text-center mt-8">
          <Link href="/ssl-certificates"><Button variant="secondary">Learn about SSL</Button></Link>
        </div>
      </div>
    </PublicLayout>
  );
}
