'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PublicLayout from '@/components/layout/PublicLayout';
import { VpsPricingCard } from '@/components/home/PricingCard';
import { PageHeader, Button } from '@/components/ui';
import { EC2_PACKAGES, BILLING_CYCLES } from '@/data/constants';
import { useCart } from '@/contexts/CartContext';
import { createVpsCartItem } from '@/lib/cart/helpers';
import { useState } from 'react';

export default function Ec2PricingPage() {
  const { addItem } = useCart();
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState('monthly');

  const handleAdd = async (pkg) => {
    await addItem(createVpsCartItem(pkg, { billingCycle }));
    router.push('/cart');
  };

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <PageHeader
          title="EC2 Pricing"
          description="Transparent pricing with no hidden fees. Choose monthly or annual billing."
          action={
            <div className="flex gap-2">
              {BILLING_CYCLES.map((c) => (
                <Button
                  key={c.id}
                  variant={billingCycle === c.id ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setBillingCycle(c.id)}
                >
                  {c.label}
                </Button>
              ))}
            </div>
          }
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {EC2_PACKAGES.map((pkg) => (
            <VpsPricingCard key={pkg.id} pkg={pkg} onAddToCart={handleAdd} />
          ))}
        </div>
        <div className="text-center">
          <p className="text-neutral-400 mb-4">Need flexible hourly billing?</p>
          <Link href="/pay-as-you-go"><Button variant="secondary">Try pay-as-you-go EC2</Button></Link>
        </div>
      </div>
    </PublicLayout>
  );
}
