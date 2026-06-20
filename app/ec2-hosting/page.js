'use client';

import { useRouter } from 'next/navigation';
import PublicLayout from '@/components/layout/PublicLayout';
import { VpsPricingCard } from '@/components/home/PricingCard';
import { PageHeader } from '@/components/ui';
import { EC2_PACKAGES } from '@/data/constants';
import { useCart } from '@/contexts/CartContext';
import { createVpsCartItem } from '@/lib/cart/helpers';

export default function Ec2HostingPage() {
  const { addItem } = useCart();
  const router = useRouter();

  const handleAdd = async (pkg) => {
    await addItem(createVpsCartItem(pkg));
    router.push('/cart');
  };

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <PageHeader
          title="EC2 Hosting"
          description="High-performance EC2 instances with NVMe storage, full root access, and global data centers."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {EC2_PACKAGES.map((pkg) => (
            <VpsPricingCard key={pkg.id} pkg={pkg} onAddToCart={handleAdd} />
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
