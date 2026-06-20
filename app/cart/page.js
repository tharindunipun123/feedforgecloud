'use client';

import Link from 'next/link';
import PublicLayout from '@/components/layout/PublicLayout';
import { Button, Card, PageHeader, EmptyState, LoadingSpinner, Select } from '@/components/ui';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency } from '@/lib/billing/helpers';
import { BILLING_CYCLES } from '@/data/constants';

export default function CartPage() {
  const {
    items,
    loaded,
    billingCycle,
    changeBillingCycle,
    removeItem,
    updateQuantity,
    subtotal,
    tax,
    discount,
    total,
    coupon,
    applyCoupon,
    setCoupon,
  } = useCart();

  if (!loaded) {
    return (
      <PublicLayout>
        <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>
      </PublicLayout>
    );
  }

  if (items.length === 0) {
    return (
      <PublicLayout>
        <div className="max-w-3xl mx-auto px-4 py-16">
          <EmptyState
            title="Your cart is empty"
            description="Browse our EC2 plans and services to get started."
            action={<Link href="/ec2-pricing"><Button>Browse EC2 plans</Button></Link>}
          />
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <PageHeader title="Shopping cart" description={`${items.length} item${items.length !== 1 ? 's' : ''} in your cart`} />
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.id}>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <h3 className="text-white font-semibold">{item.name}</h3>
                    <p className="text-sm text-neutral-400 mt-1 capitalize">{item.type.replace('-', ' ')}</p>
                    {item.config && (
                      <div className="mt-2 text-xs text-neutral-500 space-y-0.5">
                        {item.config.os && <p>OS: {item.config.os}</p>}
                        {item.config.location && <p>Location: {item.config.location}</p>}
                        {item.config.vcpu && <p>{item.config.vcpu} vCPU · {item.config.ram} GB RAM</p>}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    {item.type !== 'payg' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                          className="w-8 h-8 border border-neutral-700 rounded text-white hover:border-white"
                        >−</button>
                        <span className="text-white w-6 text-center">{item.quantity || 1}</span>
                        <button
                          onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                          className="w-8 h-8 border border-neutral-700 rounded text-white hover:border-white"
                        >+</button>
                      </div>
                    )}
                    <span className="text-white font-semibold">{formatCurrency(item.price * (item.quantity || 1))}</span>
                    <button onClick={() => removeItem(item.id)} className="text-neutral-500 hover:text-white text-sm">Remove</button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div>
            <Card className="sticky top-8">
              <h2 className="text-lg font-semibold text-white mb-4">Order summary</h2>
              {items.every((i) => i.type !== 'payg') && (
                <Select
                  label="Billing cycle"
                  value={billingCycle}
                  onChange={(e) => changeBillingCycle(e.target.value)}
                  options={BILLING_CYCLES.map((c) => ({ value: c.id, label: c.label }))}
                  className="mb-4"
                />
              )}
              <div className="flex gap-2 mb-4">
                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="Coupon code"
                  className="flex-1 px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-white text-sm"
                />
                <Button variant="secondary" size="sm" onClick={() => applyCoupon(coupon)}>Apply</Button>
              </div>
              <div className="space-y-2 text-sm mb-6">
                <div className="flex justify-between"><span className="text-neutral-400">Subtotal</span><span className="text-white">{formatCurrency(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-neutral-400">Tax</span><span className="text-white">{formatCurrency(tax)}</span></div>
                {discount > 0 && <div className="flex justify-between"><span className="text-neutral-400">Discount</span><span className="text-white">−{formatCurrency(discount)}</span></div>}
                <div className="flex justify-between pt-2 border-t border-neutral-800 font-semibold">
                  <span className="text-white">Total</span><span className="text-white">{formatCurrency(total)}</span>
                </div>
              </div>
              <Link href="/checkout"><Button className="w-full">Proceed to checkout</Button></Link>
            </Card>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
