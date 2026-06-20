'use client';

import { Button } from '@/components/ui';
import { formatCurrency } from '@/lib/billing/helpers';
import { isPaymentTestMode } from '@/data/countries';
import { formatLkr } from '@/data/geniebiz';

export default function PaymentGatewayPanel({
  gateway,
  countryName,
  total,
  onPay,
  submitting,
  error,
  genieBizPayment = null,
}) {
  const testMode = isPaymentTestMode();
  const isGenieBiz = gateway.id === 'geniebiz';

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
            {isGenieBiz && genieBizPayment ? (
              <p className="text-white font-semibold">{formatLkr(genieBizPayment.amountLkr)}</p>
            ) : (
              <p className="text-white font-semibold">{formatCurrency(total)}</p>
            )}
          </div>
        </div>

        {isGenieBiz && genieBizPayment ? (
          <div className="border border-dashed border-neutral-700 rounded-lg p-6">
            <p className="text-white font-medium mb-1">GenieBiz — {genieBizPayment.planName}</p>
            <p className="text-neutral-500 text-sm mb-4">
              You will be redirected to a secure GenieBiz payment page to complete your payment in Sri Lankan Rupees.
            </p>
            <div className="bg-black border border-neutral-800 rounded-lg p-4 text-center">
              <p className="text-neutral-500 text-xs mb-1">Payment amount</p>
              <p className="text-2xl font-bold text-white">{formatLkr(genieBizPayment.amountLkr)}</p>
            </div>
            <p className="text-xs text-neutral-500 mt-4 text-center">
              A secure GenieBiz payment window will open in a popup. Your order stays pending until payment is confirmed.
            </p>
          </div>
        ) : isGenieBiz ? (
          <div className="border border-dashed border-red-900/40 rounded-lg p-6 text-center bg-red-950/20">
            <p className="text-red-300 font-medium mb-1">GenieBiz not available for this cart</p>
            <p className="text-neutral-400 text-sm">
              GenieBiz is available for a single monthly EC2 plan. Adjust your cart or billing cycle to continue.
            </p>
          </div>
        ) : (
          <div className="border border-dashed border-neutral-700 rounded-lg p-6 text-center">
            <p className="text-white font-medium mb-1">Stripe — International Payments</p>
            <p className="text-neutral-500 text-sm">
              Secure card payments for international customers outside Sri Lanka.
            </p>
          </div>
        )}
      </div>

      {testMode && (
        <div className="bg-neutral-950 border border-neutral-700 rounded-lg p-4">
          <p className="text-sm text-neutral-300 mb-1">
            <span className="text-white font-medium">Test mode enabled.</span> No real payment gateway is connected.
          </p>
          <p className="text-xs text-neutral-500">
            Payment will be simulated, your order will be confirmed, and services will enter provisioning.
          </p>
        </div>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <Button
        className="w-full"
        onClick={onPay}
        disabled={submitting || (isGenieBiz && !genieBizPayment && !testMode)}
      >
        {submitting
          ? 'Processing payment...'
          : testMode
            ? `Complete test payment via ${gateway.name}`
            : isGenieBiz && genieBizPayment
              ? `Pay ${formatLkr(genieBizPayment.amountLkr)} with GenieBiz`
              : `Pay ${formatCurrency(total)} with ${gateway.name}`}
      </Button>

      {!testMode && isGenieBiz && genieBizPayment && (
        <p className="text-xs text-neutral-500 text-center">
          A popup payment window will open. Complete payment there while this page shows your pending order.
        </p>
      )}

      {!testMode && !isGenieBiz && (
        <p className="text-xs text-neutral-500 text-center">
          You will be redirected to {gateway.name} to complete your payment securely.
        </p>
      )}
    </div>
  );
}
