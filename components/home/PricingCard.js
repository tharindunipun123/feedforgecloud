'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';
import { formatCurrency, CHECKOUT_TAX_PER_PACKAGE } from '@/lib/billing/helpers';

export function PricingCard({ pkg, onAddToCart, detailHref, showRenewal = true }) {
  return (
    <div
      className={`relative bg-neutral-950 border rounded-xl p-6 flex flex-col ${
        pkg.popular ? 'border-white' : 'border-neutral-800'
      }`}
    >
      {pkg.popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-white text-black text-xs font-semibold rounded-full">
          Most Popular
        </span>
      )}

      <h3 className="text-xl font-bold text-white mb-1">{pkg.name}</h3>
      <div className="mb-4">
        <span className="text-3xl font-bold text-white">{formatCurrency(pkg.monthlyPrice)}</span>
        <span className="text-neutral-400 text-sm">/mo</span>
      </div>

      {showRenewal && (
        <p className="text-neutral-500 text-xs mb-4">
          Renews at {formatCurrency(pkg.renewalPrice)}/mo
        </p>
      )}

      <ul className="space-y-2 mb-6 flex-1">
        {(pkg.features || []).map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-neutral-300">
            <svg className="w-4 h-4 text-white shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {f}
          </li>
        ))}
      </ul>

      <div className="space-y-2">
        <Button className="w-full" onClick={() => onAddToCart?.(pkg)}>
          Add to cart
        </Button>
        {detailHref && (
          <Link href={detailHref}>
            <Button variant="secondary" className="w-full">
              View details
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

export function VpsPricingCard({ pkg, onAddToCart }) {
  return (
    <div
      className={`relative bg-neutral-950 border rounded-xl p-6 flex flex-col ${
        pkg.popular ? 'border-white' : 'border-neutral-800'
      }`}
    >
      {pkg.popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-white text-black text-xs font-semibold rounded-full">
          Most Popular
        </span>
      )}

      <h3 className="text-xl font-bold text-white mb-1">{pkg.name}</h3>
      <div className="mb-2">
        <span className="text-3xl font-bold text-white">{formatCurrency(pkg.monthlyPrice)}</span>
        <span className="text-neutral-400 text-sm">/mo</span>
      </div>
      <p className="text-neutral-500 text-xs mb-4">Renews at {formatCurrency(pkg.renewalPrice)}/mo · Monthly billing</p>

      <div className="space-y-2 mb-6 text-sm">
        <div className="flex justify-between py-2 border-b border-neutral-800">
          <span className="text-neutral-400">vCPU</span>
          <span className="text-white">{pkg.vcpu}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-neutral-800">
          <span className="text-neutral-400">RAM</span>
          <span className="text-white">{pkg.ram}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-neutral-800">
          <span className="text-neutral-400">Storage</span>
          <span className="text-white">{pkg.storage}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-neutral-800">
          <span className="text-neutral-400">Bandwidth</span>
          <span className="text-white">{pkg.bandwidth}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-neutral-800">
          <span className="text-neutral-400">Location</span>
          <span className="text-white">Multiple regions</span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-neutral-400">OS</span>
          <span className="text-white">Linux & Windows</span>
        </div>
      </div>

      <div className="space-y-2 mt-auto">
        <Button className="w-full" onClick={() => onAddToCart?.(pkg)}>
          Add to cart
        </Button>
        <Link href={`/ec2-hosting/${pkg.slug}`}>
          <Button variant="secondary" className="w-full">
            View details
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function StreamingPricingCard({ pkg, onAddToCart }) {
  return (
    <div
      className={`relative bg-neutral-950 border rounded-xl p-6 flex flex-col ${
        pkg.popular ? 'border-white' : 'border-neutral-800'
      }`}
    >
      {pkg.popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-white text-black text-xs font-semibold rounded-full">
          Most Popular
        </span>
      )}

      <h3 className="text-xl font-bold text-white mb-1">{pkg.name}</h3>
      <div className="mb-2">
        <span className="text-3xl font-bold text-white">{formatCurrency(pkg.monthlyPrice)}</span>
        <span className="text-neutral-400 text-sm">/mo</span>
      </div>
      <p className="text-neutral-500 text-xs mb-4">
        + {formatCurrency(CHECKOUT_TAX_PER_PACKAGE)} tax at checkout · Renews at {formatCurrency(pkg.renewalPrice)}/mo
      </p>

      <div className="space-y-2 mb-6 text-sm">
        <div className="flex justify-between py-2 border-b border-neutral-800">
          <span className="text-neutral-400">Listeners</span>
          <span className="text-white">{pkg.maxListeners?.toLocaleString()}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-neutral-800">
          <span className="text-neutral-400">Streams</span>
          <span className="text-white">{pkg.maxStreams}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-neutral-800">
          <span className="text-neutral-400">Bandwidth</span>
          <span className="text-white">{pkg.bandwidth}</span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-neutral-400">Bitrate</span>
          <span className="text-white">{pkg.bitrate}</span>
        </div>
      </div>

      <ul className="space-y-2 mb-6 flex-1">
        {(pkg.features || []).slice(0, 4).map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs text-neutral-300">
            <svg className="w-3.5 h-3.5 text-white shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {f}
          </li>
        ))}
      </ul>

      <div className="space-y-2 mt-auto">
        <Button className="w-full" onClick={() => onAddToCart?.(pkg)}>
          Add to cart
        </Button>
        <Link href={`/live-streaming/${pkg.slug}`}>
          <Button variant="secondary" className="w-full">
            View details
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function SslPricingCard({ pkg, onAddToCart }) {
  const totalWithTax = pkg.annualPrice + CHECKOUT_TAX_PER_PACKAGE;

  return (
    <div
      className={`relative bg-neutral-950 border rounded-xl p-6 flex flex-col ${
        pkg.popular ? 'border-white' : 'border-neutral-800'
      }`}
    >
      {pkg.popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-white text-black text-xs font-semibold rounded-full">
          Most Popular
        </span>
      )}

      <span className="text-xs text-emerald-400 font-medium mb-2">Annual billing only</span>
      <h3 className="text-xl font-bold text-white mb-1">{pkg.name}</h3>
      <div className="mb-2">
        <span className="text-3xl font-bold text-white">{formatCurrency(pkg.annualPrice)}</span>
        <span className="text-neutral-400 text-sm">/year</span>
      </div>
      <p className="text-neutral-500 text-xs mb-4">
        + {formatCurrency(CHECKOUT_TAX_PER_PACKAGE)} tax · Temp SSL included · {formatCurrency(totalWithTax)}/yr total
      </p>

      <div className="space-y-2 mb-6 text-sm">
        <div className="flex justify-between py-2 border-b border-neutral-800">
          <span className="text-neutral-400">Validation</span>
          <span className="text-white text-right text-xs">{pkg.validation}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-neutral-800">
          <span className="text-neutral-400">Coverage</span>
          <span className="text-white">{pkg.domains}</span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-neutral-400">Temp SSL</span>
          <span className="text-emerald-400 text-xs">Included free</span>
        </div>
      </div>

      <ul className="space-y-2 mb-6 flex-1">
        {(pkg.features || []).slice(0, 5).map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs text-neutral-300">
            <svg className="w-3.5 h-3.5 text-white shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {f}
          </li>
        ))}
      </ul>

      <div className="space-y-2 mt-auto">
        <Button className="w-full" onClick={() => onAddToCart?.(pkg)}>
          Add to cart
        </Button>
        <Link href={`/ssl-certificates/${pkg.slug}`}>
          <Button variant="secondary" className="w-full">
            View details
          </Button>
        </Link>
      </div>
    </div>
  );
}
