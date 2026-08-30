'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import PublicLayout from '@/components/layout/PublicLayout';
import { Button, Card, LoadingSpinner } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { isPaymentTestMode } from '@/data/countries';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const sessionId = searchParams.get('session_id');
  const { user, loading: authLoading } = useAuth();
  const [verifying, setVerifying] = useState(!!sessionId && !isPaymentTestMode());
  const [error, setError] = useState('');
  const [serviceCount, setServiceCount] = useState(0);

  useEffect(() => {
    if (!sessionId || isPaymentTestMode()) return;
    if (authLoading) return;

    let cancelled = false;

    async function verify(attempt = 0) {
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (user) {
          const idToken = await user.getIdToken();
          headers.Authorization = `Bearer ${idToken}`;
        }

        const res = await fetch('/api/stripe/verify-session', {
          method: 'POST',
          headers,
          body: JSON.stringify({ sessionId, orderId }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Payment verification failed.');
        if (!data.confirmed) throw new Error('Payment is still processing. Check your dashboard shortly.');

        if (!cancelled) {
          setServiceCount(Array.isArray(data.serviceIds) ? data.serviceIds.length : 0);
        }
      } catch (err) {
        if (attempt < 2 && !cancelled) {
          await new Promise((r) => setTimeout(r, 1500));
          return verify(attempt + 1);
        }
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setVerifying(false);
      }
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, [sessionId, orderId, user, authLoading]);

  if (verifying) {
    return (
      <PublicLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-neutral-400 text-sm">Confirming your payment and creating your services…</p>
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
            Your payment was successful and your order has been received.
            {serviceCount > 0
              ? ` ${serviceCount} service${serviceCount === 1 ? '' : 's'} ${serviceCount === 1 ? 'is' : 'are'} now listed in your dashboard with a pending status while our team completes setup.`
              : ' Your services will appear in your dashboard shortly with a pending status while our team completes setup.'}
            {' '}Activation usually takes 10–15 minutes. Credentials will appear once ready.
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
