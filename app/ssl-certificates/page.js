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
          description="Secure your website with browser-trusted SSL. Annual plans only — billed once per year."
        />

        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-8 mb-12">
          <h2 className="text-xl font-bold text-white mb-2">Why SSL matters</h2>
          <p className="text-neutral-400 mb-4 max-w-2xl">
            SSL encrypts traffic between your visitors and your server, shows the HTTPS padlock, and helps SEO rankings.
            All plans include {formatCurrency(CHECKOUT_TAX_PER_PACKAGE)} checkout tax per certificate.
          </p>
          <div className="flex flex-wrap gap-2">
            {['256-bit encryption', 'Browser trusted', '1-year validity', 'DV & OV options'].map((f) => (
              <span key={f} className="px-3 py-1 text-xs rounded-full border border-neutral-700 text-neutral-300">
                {f}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-4xl mx-auto">
          {SSL_PACKAGES.map((pkg) => (
            <SslPricingCard key={pkg.id} pkg={pkg} onAddToCart={handleAdd} />
          ))}
        </div>

        <div className="text-center">
          <Link href="/ssl-certificates-pricing">
            <Button variant="secondary">Compare SSL plans & tax</Button>
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
