'use client';

import { Button } from '@/components/ui';
import { formatCurrency } from '@/lib/billing/helpers';
import { isPaymentTestMode } from '@/data/countries';

export default function PaymentGatewayPanel({ gateway, countryName, total, onPay, submitting, error }) {
  const testMode = isPaymentTestMode();

  return (
    <div className="space-y-6">
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Payment method</p>
            <h3 className="text-lg font-semibold text-white">{gateway.label}</h3>
            <p className="text-sm text-neutral-400 mt-1">{gateway.description}</p>
          </div>
          <div className="shrink-0 px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-xs text-neutral-300">
            {gateway.region}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 text-sm mb-4">
          <div className="bg-black border border-neutral-800 rounded-lg p-3">
            <p className="text-neutral-500 text-xs mb-1">Billing country</p>
            <p className="text-white">{countryName}</p>
          </div>
          <div className="bg-black border border-neutral-800 rounded-lg p-3">
            <p className="text-neutral-500 text-xs mb-1">Amount due</p>
            <p className="text-white font-semibold">{formatCurrency(total)}</p>
          </div>
        </div>

        <div className="border border-dashed border-neutral-700 rounded-lg p-6 text-center">
          <p className="text-white font-medium mb-1">Stripe Secure Checkout</p>
          <p className="text-neutral-500 text-sm">
            You will be redirected to Stripe to complete payment. Your streaming server enters pending configuration until provisioned.
          </p>
        </div>
      </div>

      {testMode && (
        <div className="bg-neutral-950 border border-neutral-700 rounded-lg p-4">
          <p className="text-sm text-neutral-300 mb-1">
            <span className="text-white font-medium">Test mode enabled.</span> Payment will be simulated.
          </p>
        </div>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <Button className="w-full" onClick={onPay} disabled={submitting}>
        {submitting
          ? 'Processing payment...'
          : testMode
            ? `Complete test payment via ${gateway.name}`
            : `Pay ${formatCurrency(total)} with ${gateway.name}`}
      </Button>

      {!testMode && (
        <p className="text-xs text-neutral-500 text-center">
          You will be redirected to Stripe to complete your payment securely.
        </p>
      )}
    </div>
  );
}
