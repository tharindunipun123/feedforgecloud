'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';
import { formatCurrency } from '@/lib/billing/helpers';
import { formatCreditsMB } from '@/data/cdn';

export default function CdnPlanCard({ plan, onAddToCart, showDetails = true }) {
  return (
    <div
      className={`relative bg-neutral-950 border rounded-xl p-6 flex flex-col ${
        plan.popular ? 'border-white' : 'border-neutral-800'
      }`}
    >
      {plan.popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-white text-black text-xs font-semibold rounded-full">
          Most Popular
        </span>
      )}

      <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
      <div className="mb-4">
        <span className="text-3xl font-bold text-white">{formatCurrency(plan.monthlyPrice)}</span>
        <span className="text-neutral-400 text-sm">/mo</span>
      </div>
      <p className="text-neutral-500 text-xs mb-4">
        Renews at {formatCurrency(plan.renewalPrice)}/mo
      </p>

      <div className="space-y-2 mb-4 text-sm">
        <div className="flex justify-between py-2 border-b border-neutral-800">
          <span className="text-neutral-400">Storage credits</span>
          <span className="text-white">{formatCreditsMB(plan.storageCredits)}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-neutral-800">
          <span className="text-neutral-400">Bandwidth credits</span>
          <span className="text-white">{formatCreditsMB(plan.bandwidthCredits)}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-neutral-800">
          <span className="text-neutral-400">Max image size</span>
          <span className="text-white">{plan.maxImageSizeMB} MB</span>
        </div>
        <div className="flex justify-between py-2 border-b border-neutral-800">
          <span className="text-neutral-400">Max video size</span>
          <span className="text-white">{plan.maxVideoSizeMB} MB</span>
        </div>
      </div>

      <ul className="space-y-2 mb-6 flex-1">
        {(plan.features || []).map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-neutral-300">
            <svg className="w-4 h-4 text-white shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {f}
          </li>
        ))}
      </ul>

      <div className="space-y-2">
        <Button className="w-full" onClick={() => onAddToCart?.(plan)}>
          Add to cart
        </Button>
        {showDetails && (
          <Link href={`/cdn-hosting/${plan.slug}`}>
            <Button variant="secondary" className="w-full">
              View details
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
