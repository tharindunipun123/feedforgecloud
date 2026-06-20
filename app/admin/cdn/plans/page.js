'use client';

import { PageHeader, Card, Input } from '@/components/ui';
import { CDN_PLANS, formatCreditsMB } from '@/data/cdn';
import { formatCurrency } from '@/lib/billing/helpers';

export default function AdminCdnPlansPage() {
  return (
    <div>
      <PageHeader
        title="CDN Plans"
        description="View and edit CDN plan configuration. Changes are placeholders until Firestore sync is enabled."
      />
      <div className="space-y-6">
        {CDN_PLANS.map((plan) => (
          <Card key={plan.id}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-white">{plan.name}</h2>
                <p className="text-neutral-500 text-sm">{plan.id}</p>
              </div>
              {plan.popular && (
                <span className="px-2 py-1 bg-white text-black text-xs font-semibold rounded">Popular</span>
              )}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input label="Monthly price" defaultValue={plan.monthlyPrice} type="number" step="0.01" disabled />
              <Input label="Renewal price" defaultValue={plan.renewalPrice} type="number" step="0.01" disabled />
              <Input label="Storage credits (MB)" defaultValue={plan.storageCredits} type="number" disabled />
              <Input label="Bandwidth credits (MB)" defaultValue={plan.bandwidthCredits} type="number" disabled />
              <Input label="Max image size (MB)" defaultValue={plan.maxImageSizeMB} type="number" disabled />
              <Input label="Max video size (MB)" defaultValue={plan.maxVideoSizeMB} type="number" disabled />
            </div>
            <div className="mt-4 pt-4 border-t border-neutral-800 grid sm:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-400">Storage</span>
                <span className="text-white">{formatCreditsMB(plan.storageCredits)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Bandwidth</span>
                <span className="text-white">{formatCreditsMB(plan.bandwidthCredits)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Price</span>
                <span className="text-white">{formatCurrency(plan.monthlyPrice)}/mo</span>
              </div>
            </div>
            <p className="text-xs text-neutral-500 mt-4">
              Plan data is defined in data/cdn.js. Firestore cdnPlans collection sync coming in a future update.
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
