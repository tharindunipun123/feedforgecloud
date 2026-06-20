'use client';

import Link from 'next/link';
import PublicLayout from '@/components/layout/PublicLayout';
import { Button, Card } from '@/components/ui';

export default function PaymentFailedPage() {
  return (
    <PublicLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Payment failed</h1>
        <Card className="text-left mb-8">
          <p className="text-neutral-300 leading-relaxed mb-4">
            Your payment could not be processed. No charges were made to your account.
          </p>
          <p className="text-neutral-400 text-sm">
            Please verify your payment details and try again, or contact our support team if the problem persists.
          </p>
        </Card>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/checkout"><Button>Try again</Button></Link>
          <Link href="/contact"><Button variant="secondary">Contact support</Button></Link>
        </div>
      </div>
    </PublicLayout>
  );
}
