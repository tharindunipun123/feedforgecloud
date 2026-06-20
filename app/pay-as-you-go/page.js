'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PublicLayout from '@/components/layout/PublicLayout';
import { Button, Card, PageHeader, Select } from '@/components/ui';
import {
  PAYG_OPTIONS,
  OS_OPTIONS,
  SERVER_LOCATIONS,
  calculatePaygPrice,
} from '@/data/constants';
import { formatCurrency } from '@/lib/billing/helpers';
import { useCart } from '@/contexts/CartContext';
import { createPaygCartItem } from '@/lib/cart/helpers';

function SliderRow({ label, value, options, onChange, format }) {
  const index = options.indexOf(value);
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-neutral-400">{label}</span>
        <span className="text-white font-medium">{format ? format(value) : value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={options.length - 1}
        value={index >= 0 ? index : 0}
        onChange={(e) => onChange(options[parseInt(e.target.value, 10)])}
        className="w-full accent-white"
      />
      <div className="flex justify-between text-xs text-neutral-500">
        <span>{format ? format(options[0]) : options[0]}</span>
        <span>{format ? format(options[options.length - 1]) : options[options.length - 1]}</span>
      </div>
    </div>
  );
}

export default function PayAsYouGoPage() {
  const { addItem } = useCart();
  const router = useRouter();
  const [config, setConfig] = useState({
    vcpu: PAYG_OPTIONS.vcpu[0],
    ram: PAYG_OPTIONS.ram[0],
    storage: PAYG_OPTIONS.storage[0],
    bandwidth: PAYG_OPTIONS.bandwidth[0],
    os: OS_OPTIONS[0],
    location: SERVER_LOCATIONS[0].id,
  });

  const prices = calculatePaygPrice(config);

  const handleAdd = async () => {
    await addItem(createPaygCartItem(config, prices));
    router.push('/cart');
  };

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <PageHeader
          title="Pay-as-you-go EC2"
          description="Build your custom EC2 configuration with hourly billing. Pay only for what you use."
        />
        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="space-y-6">
            <SliderRow label="vCPU" value={config.vcpu} options={PAYG_OPTIONS.vcpu} onChange={(v) => setConfig({ ...config, vcpu: v })} format={(v) => `${v} cores`} />
            <SliderRow label="RAM" value={config.ram} options={PAYG_OPTIONS.ram} onChange={(v) => setConfig({ ...config, ram: v })} format={(v) => `${v} GB`} />
            <SliderRow label="Storage" value={config.storage} options={PAYG_OPTIONS.storage} onChange={(v) => setConfig({ ...config, storage: v })} format={(v) => `${v} GB NVMe`} />
            <Select
              label="Bandwidth"
              value={config.bandwidth}
              onChange={(e) => setConfig({ ...config, bandwidth: e.target.value })}
              options={PAYG_OPTIONS.bandwidth.map((b) => ({ value: b, label: b }))}
            />
            <Select
              label="Server location"
              value={config.location}
              onChange={(e) => setConfig({ ...config, location: e.target.value })}
              options={SERVER_LOCATIONS.map((l) => ({ value: l.id, label: l.name }))}
            />
            <Select
              label="Operating system"
              value={config.os}
              onChange={(e) => setConfig({ ...config, os: e.target.value })}
              options={OS_OPTIONS.map((o) => ({ value: o, label: o }))}
            />
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-white mb-6">Estimated pricing</h2>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between py-3 border-b border-neutral-800">
                <span className="text-neutral-400">Hourly</span>
                <span className="text-white font-semibold">{formatCurrency(prices.hourly)}/hr</span>
              </div>
              <div className="flex justify-between py-3 border-b border-neutral-800">
                <span className="text-neutral-400">Daily estimate</span>
                <span className="text-white font-semibold">{formatCurrency(prices.daily)}/day</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-neutral-400">Monthly estimate</span>
                <span className="text-2xl font-bold text-white">{formatCurrency(prices.monthly)}/mo</span>
              </div>
            </div>
            <p className="text-xs text-neutral-500 mb-6">
              Estimates based on continuous usage. Actual charges are calculated from real usage and invoiced by admin.
            </p>
            <Button className="w-full" onClick={handleAdd}>Add configuration to cart</Button>
          </Card>
        </div>
      </div>
    </PublicLayout>
  );
}
