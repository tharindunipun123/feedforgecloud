'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import PublicLayout from '@/components/layout/PublicLayout';
import { Button, Card } from '@/components/ui';
import { getSslPackageBySlug } from '@/data/ssl-certificates';
import { CHECKOUT_TAX_PER_PACKAGE, formatCurrency } from '@/lib/billing/helpers';
import { useCart } from '@/contexts/CartContext';
import { createSslCartItem } from '@/lib/cart/helpers';

export default function SslCertificateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCart();
  const pkg = getSslPackageBySlug(params.slug);

  if (!pkg) {
    return (
      <PublicLayout>
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl text-white mb-4">Plan not found</h1>
          <Link href="/ssl-certificates-pricing"><Button>View pricing</Button></Link>
        </div>
      </PublicLayout>
    );
  }

  const total = pkg.annualPrice + CHECKOUT_TAX_PER_PACKAGE;

  const handleAdd = async () => {
    await addItem(createSslCartItem(pkg));
    router.push('/cart');
  };

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Link href="/ssl-certificates-pricing" className="text-sm text-neutral-400 hover:text-white mb-6 inline-block">
          ← All SSL plans
        </Link>

        <div className="mb-8">
          <span className="text-xs text-emerald-400 font-medium">Annual only</span>
          <h1 className="text-3xl font-bold text-white mb-2">{pkg.name}</h1>
          <p className="text-neutral-400">
            {formatCurrency(pkg.annualPrice)}/year + {formatCurrency(CHECKOUT_TAX_PER_PACKAGE)} tax ={' '}
            <span className="text-white font-semibold">{formatCurrency(total)}</span> at checkout
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <h2 className="text-white font-semibold mb-4">Certificate details</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <dt className="text-neutral-400">Validation</dt>
                <dd className="text-white">{pkg.validation}</dd>
              </div>
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <dt className="text-neutral-400">Domain coverage</dt>
                <dd className="text-white">{pkg.domains}</dd>
              </div>
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <dt className="text-neutral-400">Billing</dt>
                <dd className="text-white">Annual only</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-400">Validity period</dt>
                <dd className="text-white">1 year</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h2 className="text-white font-semibold mb-4">Included</h2>
            <ul className="space-y-2">
              {pkg.features.map((f) => (
                <li key={f} className="text-sm text-neutral-300 flex gap-2">
                  <span className="text-white">✓</span> {f}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <Button size="lg" onClick={handleAdd}>
          Add to cart — {formatCurrency(total)}/year (incl. tax)
        </Button>
      </div>
    </PublicLayout>
  );
}
