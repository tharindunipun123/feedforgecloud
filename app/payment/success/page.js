'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import PublicLayout from '@/components/layout/PublicLayout';
import { Button, Card, LoadingSpinner } from '@/components/ui';
import { auth } from '@/lib/firebase/config';
import { isPaymentTestMode } from '@/data/countries';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const sessionId = searchParams.get('session_id');
  const [verifying, setVerifying] = useState(!!sessionId && !isPaymentTestMode());
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sessionId || isPaymentTestMode()) return;

    async function verify() {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) {
          setVerifying(false);
          return;
        }

        const res = await fetch('/api/stripe/verify-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ sessionId, orderId }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Payment verification failed.');
        if (!data.confirmed) throw new Error('Payment is still processing. Check your dashboard shortly.');
      } catch (err) {
        setError(err.message);
      } finally {
        setVerifying(false);
      }
    }

    verify();
  }, [sessionId, orderId]);

  if (verifying) {
    return (
      <PublicLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-neutral-400 text-sm">Confirming your payment…</p>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Payment successful</h1>
        <Card className="text-left mb-8">
          {error ? (
            <p className="text-yellow-400 text-sm mb-3">{error}</p>
          ) : null}
          <p className="text-neutral-300 leading-relaxed">
            Payment successful. Your order has been received. Our system is now provisioning your service. EC2 credentials or service setup details will be sent to your email and dashboard within a few minutes. EC2 provisioning usually takes 10–15 minutes.
          </p>
          {orderId && (
            <p className="text-sm text-neutral-500 mt-4">Order ID: {orderId}</p>
          )}
        </Card>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard/services"><Button>View my services</Button></Link>
          <Link href="/dashboard"><Button variant="secondary">Go to dashboard</Button></Link>
        </div>
      </div>
    </PublicLayout>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<PublicLayout><div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div></PublicLayout>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
