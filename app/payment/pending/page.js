'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import PublicLayout from '@/components/layout/PublicLayout';
import { Button, Card, LoadingSpinner } from '@/components/ui';

function PaymentPendingContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <PublicLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-yellow-950/50 border border-yellow-800/50 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Order pending</h1>
          <p className="text-neutral-400">Your order is awaiting payment or provisioning</p>
        </div>

        <Card className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-950/60 text-yellow-300 border border-yellow-800/50">
              Pending
            </span>
            {orderId && (
              <span className="text-xs text-neutral-500 font-mono">#{orderId.slice(0, 12)}…</span>
            )}
          </div>

          <p className="text-neutral-300 leading-relaxed mb-4">
            If you completed Stripe checkout, your payment may still be processing. Live streaming services enter{' '}
            <strong className="text-white">provisioning</strong> after payment is confirmed — stream URLs and credentials appear in your dashboard once activated.
          </p>

          <p className="text-neutral-500 text-sm">
            Provisioning usually starts within 10–15 minutes after successful payment.
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
