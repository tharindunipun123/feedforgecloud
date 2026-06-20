'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PublicLayout from '@/components/layout/PublicLayout';
import { Button, Select, Card } from '@/components/ui';
import {
  getPackageBySlug,
  EC2_PACKAGES,
  OS_OPTIONS,
  SERVER_LOCATIONS,
  BILLING_CYCLES,
  FAQ_ITEMS,
} from '@/data/constants';
import { formatCurrency } from '@/lib/billing/helpers';
import { useCart } from '@/contexts/CartContext';
import { createVpsCartItem } from '@/lib/cart/helpers';
import { useState } from 'react';

export default function Ec2DetailPage() {
  const { slug } = useParams();
  const pkg = getPackageBySlug(slug);
  const { addItem } = useCart();
  const router = useRouter();
  const [os, setOs] = useState(OS_OPTIONS[0]);
  const [location, setLocation] = useState(SERVER_LOCATIONS[0].id);
  const [billingCycle, setBillingCycle] = useState('monthly');

  if (!pkg) {
    return (
      <PublicLayout>
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Plan not found</h1>
          <Link href="/ec2-hosting"><Button>View all EC2 plans</Button></Link>
        </div>
      </PublicLayout>
    );
  }

  const price = billingCycle === 'annual' ? pkg.monthlyPrice * 10 : pkg.monthlyPrice;

  const handleAdd = async () => {
    await addItem(createVpsCartItem(pkg, { os, location, billingCycle }));
    router.push('/cart');
  };

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <Link href="/ec2-hosting" className="text-sm text-neutral-400 hover:text-white mb-4 inline-block">← Back to EC2 plans</Link>
              <h1 className="text-3xl font-bold text-white mb-2">{pkg.name}</h1>
              <p className="text-neutral-400">Enterprise-grade EC2 instance with full root access and DDoS protection.</p>
            </div>

            <Card>
              <h2 className="text-lg font-semibold text-white mb-4">Technical specifications</h2>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                {[
                  ['vCPU', pkg.vcpu],
                  ['RAM', pkg.ram],
                  ['Storage', pkg.storage],
                  ['Bandwidth', pkg.bandwidth],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2 border-b border-neutral-800">
                    <span className="text-neutral-400">{k}</span>
                    <span className="text-white">{v}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold text-white mb-4">Included features</h2>
              <ul className="space-y-2">
                {pkg.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-neutral-300">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold text-white mb-4">FAQ</h2>
              <div className="space-y-3">
                {FAQ_ITEMS.slice(0, 3).map((item) => (
                  <details key={item.question} className="border border-neutral-800 rounded-lg">
                    <summary className="px-4 py-3 text-white text-sm cursor-pointer">{item.question}</summary>
                    <p className="px-4 pb-3 text-neutral-400 text-sm">{item.answer}</p>
                  </details>
                ))}
              </div>
            </Card>
          </div>

          <div>
            <Card className="sticky top-8">
              <div className="mb-6">
                <span className="text-3xl font-bold text-white">{formatCurrency(price)}</span>
                <span className="text-neutral-400 text-sm">/{billingCycle === 'annual' ? 'year' : 'mo'}</span>
                <p className="text-neutral-500 text-xs mt-1">Renews at {formatCurrency(pkg.renewalPrice)}/mo</p>
              </div>

              <div className="space-y-4 mb-6">
                <Select
                  label="Billing cycle"
                  value={billingCycle}
                  onChange={(e) => setBillingCycle(e.target.value)}
                  options={BILLING_CYCLES.map((c) => ({ value: c.id, label: c.label }))}
                />
                <Select
                  label="Operating system"
                  value={os}
                  onChange={(e) => setOs(e.target.value)}
                  options={OS_OPTIONS.map((o) => ({ value: o, label: o }))}
                />
                <Select
                  label="Server location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  options={SERVER_LOCATIONS.map((l) => ({ value: l.id, label: l.name }))}
                />
              </div>

              <Button className="w-full mb-3" onClick={handleAdd}>Add to cart</Button>
              <p className="text-xs text-neutral-500 text-center">
                Provisioning usually takes 10–15 minutes after payment confirmation.
              </p>
              <p className="text-xs text-neutral-500 text-center mt-2">
                Need help? <Link href="/contact" className="text-white hover:underline">Contact support</Link>
              </p>
            </Card>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
