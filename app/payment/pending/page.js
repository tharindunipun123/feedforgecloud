'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import PublicLayout from '@/components/layout/PublicLayout';
import { Button, Card, LoadingSpinner } from '@/components/ui';
import { formatLkr } from '@/data/geniebiz';
import {
  openPaymentPopup,
  markPaymentPopupOpened,
  wasPaymentPopupOpened,
} from '@/lib/payment/open-payment-popup';

function PaymentPendingContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');
  const payLink = searchParams.get('link');
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);

  const openPayWindow = useCallback(() => {
    if (!payLink) return false;
    const result = openPaymentPopup(decodeURIComponent(payLink));
    if (result.success) {
      setPopupBlocked(false);
      setPopupOpen(true);
      if (orderId) markPaymentPopupOpened(orderId);
      return true;
    }
    setPopupBlocked(true);
    return false;
  }, [payLink, orderId]);

  useEffect(() => {
    if (orderId && wasPaymentPopupOpened(orderId)) {
      setPopupOpen(true);
    }
  }, [orderId]);

  useEffect(() => {
    if (!payLink || !orderId) return;
    if (wasPaymentPopupOpened(orderId)) return;
    const opened = openPayWindow();
    if (!opened) setPopupBlocked(true);
  }, [payLink, orderId, openPayWindow]);

  return (
    <PublicLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-yellow-950/50 border border-yellow-800/50 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Payment pending</h1>
          <p className="text-neutral-400">Your order is waiting for payment confirmation</p>
        </div>

        <Card className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-950/60 text-yellow-300 border border-yellow-800/50">
              Pending payment
            </span>
            {orderId && (
              <span className="text-xs text-neutral-500 font-mono">#{orderId.slice(0, 12)}…</span>
            )}
          </div>

          <p className="text-neutral-300 leading-relaxed mb-4">
            Your order has been placed and is in <strong className="text-white">pending</strong> state until GenieBiz payment is confirmed by our team.
            {amount && (
              <> Pay <strong className="text-white">{formatLkr(Number(amount))}</strong> in the payment window.</>
            )}
          </p>

          {payLink && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 mb-4">
              <p className="text-sm text-white font-medium mb-1">GenieBiz payment window</p>
              <p className="text-xs text-neutral-400 mb-4">
                Complete payment in the popup window. Keep this tab open — your order status will update after admin confirmation.
              </p>

              {popupBlocked && (
                <p className="text-yellow-400 text-sm mb-3 bg-yellow-950/30 border border-yellow-900/40 rounded-lg px-3 py-2">
                  Popup was blocked by your browser. Click the button below to open the payment page.
                </p>
              )}

              {popupOpen && !popupBlocked && (
                <p className="text-green-400 text-sm mb-3 bg-green-950/30 border border-green-900/40 rounded-lg px-3 py-2">
                  Payment window opened. Complete your payment there.
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button onClick={openPayWindow}>Open payment window</Button>
                <a
                  href={decodeURIComponent(payLink)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium rounded-lg border border-neutral-600 text-white hover:border-white hover:bg-neutral-900 transition-colors"
                >
                  Open in new tab
                </a>
              </div>
            </div>
          )}

          <p className="text-neutral-500 text-sm">
            After payment, provisioning usually starts within 10–15 minutes once our team verifies your GenieBiz payment.
          </p>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard/billing"><Button>View billing & orders</Button></Link>
          <Link href="/dashboard"><Button variant="secondary">Go to dashboard</Button></Link>
        </div>
      </div>
    </PublicLayout>
  );
}

export default function PaymentPendingPage() {
  return (
    <Suspense fallback={<PublicLayout><div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div></PublicLayout>}>
      <PaymentPendingContent />
    </Suspense>
  );
}
